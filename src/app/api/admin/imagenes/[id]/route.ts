import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 1. Get image record
    const imageRecord = await prisma.imageBandeja.findUnique({
      where: { id }
    });

    if (!imageRecord) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    // 2. Extract path from URL to delete from Storage
    // url format: https://[ref].supabase.co/storage/v1/object/public/product-images/bandeja/123-name.webp
    const urlParts = imageRecord.url.split('/product-images/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      const supabaseAdmin = getSupabaseAdmin();
      const { error: deleteError } = await supabaseAdmin.storage
        .from('product-images')
        .remove([storagePath]);
      
      if (deleteError) {
        console.error('Storage deletion error:', deleteError);
        // Continue deleting from DB even if storage fails
      }
    }

    // 3. Delete from DB
    await prisma.imageBandeja.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { productId } = await req.json();

    const imageRecord = await prisma.imageBandeja.update({
      where: { id },
      data: {
        assigned: true,
        productId: productId || null
      }
    });

    return NextResponse.json(imageRecord);
  } catch (error) {
    console.error('Error updating image assignment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
