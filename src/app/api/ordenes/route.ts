import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { formatCOP } from '@/lib/utils/carlin-pricing';

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().positive(),
    imageUrl: z.string().optional(),
  })).min(1),
  total: z.number().positive(),
  priceLevel: z.enum(['retail', 'wholesale', 'distributor']),
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = orderSchema.parse(body);

    // Get session to securely determine if this is a wholesale/distributor user
    const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });
    
    // Create a safe default config if it doesn't exist
    const safeConfig = config || {
      id: 'singleton',
      wholesaleMinOrder: 200000 as any,
      distributorMinOrder: 400000 as any,
      inactivityDays: 30,
      announcementText: null,
      announcementActive: false,
      heroUseVideo: false,
      updatedAt: new Date()
    };
    
    const sessionResult = await getSessionResult(safeConfig);
    const wholesaleUserId = sessionResult.user?.id;
    
    // Determine the Prisma enum value for priceLevel
    const prismaPriceLevel = 
      validated.priceLevel === 'distributor' ? 'DISTRIBUTOR' :
      validated.priceLevel === 'wholesale' ? 'WHOLESALE' : 'RETAIL';

    // 1. Create the order
    const order = await prisma.order.create({
      data: {
        total: validated.total,
        priceLevel: prismaPriceLevel,
        status: 'PENDING_WHATSAPP',
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        wholesaleUserId: wholesaleUserId || null,
        guestEmail: sessionResult.user?.email || null,
        items: {
          create: validated.items.map(i => ({
            productId: i.productId,
            name: i.name,
            priceSnapshot: i.price,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
          }))
        }
      }
    });

    // 2. Update lastOrderAt if applicable
    if (wholesaleUserId) {
      await prisma.wholesaleUser.update({
        where: { id: wholesaleUserId },
        data: { lastOrderAt: new Date() }
      });
    }

    // 3. Construct WhatsApp Message
    let msg = '';
    const orderNumber = order.id.slice(-6).toUpperCase();

    if (validated.priceLevel === 'retail') {
      msg += `¡Hola Carlin! 💄 Me gustaría hacer el siguiente pedido:\n\n`;
      msg += `📋 Pedido #${orderNumber}\n`;
    } else if (validated.priceLevel === 'wholesale') {
      msg += `¡Hola Carlin! Soy mayorista y quiero hacer el siguiente pedido:\n\n`;
      msg += `🏷️ Pedido MAYORISTA #${orderNumber}\n`;
    } else {
      msg += `¡Hola Carlin! Soy distribuidor y quiero hacer el siguiente pedido:\n\n`;
      msg += `⭐ Pedido DISTRIBUIDOR #${orderNumber}\n`;
    }
    
    validated.items.forEach(item => {
      msg += `• ${item.name} x${item.quantity} = ${formatCOP(item.price * item.quantity)}\n`;
    });
    
    msg += `─────────────────────\n`;
    
    if (validated.priceLevel === 'retail') {
      msg += `💰 Total: ${formatCOP(validated.total)}\n\n`;
    } else if (validated.priceLevel === 'wholesale') {
      msg += `💰 Total mayorista: ${formatCOP(validated.total)}\n\n`;
    } else {
      msg += `💰 Total distribuidor: ${formatCOP(validated.total)}\n\n`;
    }

    msg += `📞 Mis datos:\n`;
    msg += `Nombre: ${validated.customerName}\n`;
    msg += `Teléfono: ${validated.customerPhone}`;

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
