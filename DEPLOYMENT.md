## Checklist de despliegue — CARLIN en Vercel

- [ ] Variables de entorno configuradas en Vercel Settings:
      DATABASE_URL (pooler, puerto 6543, ?pgbouncer=true)
      DIRECT_URL (pooler, puerto 5432)
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SUPABASE_SERVICE_ROLE_KEY (marcar como Sensitive)
      NEXT_PUBLIC_WHATSAPP_NUMBER (formato: 573XXXXXXXXX)
      ADMIN_PIN (marcar como Sensitive)
      RESEND_API_KEY
      RESEND_TO_EMAIL
      NEXT_PUBLIC_WHOLESALE_MIN_ORDER=200000
      NEXT_PUBLIC_DISTRIBUTOR_MIN_ORDER=400000
- [ ] Buckets en Supabase Storage creados y públicos:
      product-images, brand-logos, hero-media
- [ ] Dominio configurado en Vercel → Settings → Domains
- [ ] npx prisma db push (con variables de producción)
- [ ] npx prisma db seed (una sola vez)
- [ ] Verificar /api/health → { status: 'ok' }
- [ ] Subir al menos una imagen de hero desde /admin/configuracion
- [ ] Verificar que /catalogo carga productos reales
- [ ] Verificar que /admin/login funciona con el PIN de producción
- [ ] Probar flujo completo: agregar producto al carrito → generar pedido → WhatsApp abre con el resumen
