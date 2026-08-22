-- ═══════════════════════════════════════════
-- CARLIN — Row Level Security Policies
-- Ejecutar una sola vez en Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Activar RLS en todas las tablas públicas
ALTER TABLE "public"."Product"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Brand"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Tag"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductTag"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Discount"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WholesaleUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ImageBandeja"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SiteConfig"    ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════
-- TABLAS DE CATÁLOGO PÚBLICO
-- Lectura pública para el catálogo (solo productos activos).
-- Escritura SOLO para service_role (Prisma desde el servidor).
-- ═══════════════════════════════════════════

-- Product: solo productos activos son públicamente legibles
CREATE POLICY "Public can read active products"
  ON "public"."Product"
  FOR SELECT
  USING (active = true);

-- Category: solo categorías/subcategorías activas son públicamente legibles.
-- (Antes era USING (true); se ajustó al añadir la columna `active` en la fase 5,
--  para alinearla con el mismo patrón que ya usa Product.)
DROP POLICY IF EXISTS "Public can read categories" ON "public"."Category";
CREATE POLICY "Public can read active categories"
  ON "public"."Category"
  FOR SELECT
  USING (active = true);

-- Brand, Tag: lectura pública total

CREATE POLICY "Public can read brands"
  ON "public"."Brand"
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read tags"
  ON "public"."Tag"
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read product tags"
  ON "public"."ProductTag"
  FOR SELECT
  USING (true);

-- Discount: lectura pública solo de descuentos activos
CREATE POLICY "Public can read active discounts"
  ON "public"."Discount"
  FOR SELECT
  USING (active = true);

-- SiteConfig: lectura pública (contiene texto del banner, hero, etc.)
CREATE POLICY "Public can read site config"
  ON "public"."SiteConfig"
  FOR SELECT
  USING (id = 'singleton');

-- ═══════════════════════════════════════════
-- TABLAS PRIVADAS
-- Sin acceso directo vía anon key.
-- Solo accesibles desde el servidor (service_role = Prisma).
-- ═══════════════════════════════════════════

-- WholesaleUser: un mayorista puede leer SOLO su propio registro
CREATE POLICY "Wholesale user can read own record"
  ON "public"."WholesaleUser"
  FOR SELECT
  USING (auth.uid()::text = "authId");

-- Order: un mayorista puede leer SÓLO sus propias órdenes.
--
-- ⚠ FUGA DE PII CORREGIDA (2026-08-21) ⚠
-- La versión anterior terminaba en `OR "wholesaleUserId" IS NULL`. La intención
-- era permitir consultar pedidos de mostrador, pero TODO pedido retail tiene ese
-- campo en NULL por definición, así que la condición era verdadera para ellos y
-- la tabla entera quedaba legible con la anon key pública: nombre y teléfono de
-- clientes reales salían con un simple GET sin autenticar a /rest/v1/Order.
-- Verificado en vivo y corregido. Ningún código lee Order/OrderItem por
-- supabase-js: todo pasa por Prisma (conexión directa, que no aplica RLS), así
-- que estrechar esto no rompe ninguna funcionalidad.
--
-- Reglas al escribir políticas aquí:
--   · Nunca añadir `OR <col> IS NULL` sobre la columna que define la propiedad
--     de la fila: convierte "sin dueño" en "de todos".
--   · Acotar con TO authenticated y exigir auth.uid() IS NOT NULL, para que un
--     auth.uid() nulo (anon) no pueda cuadrar con nada.
DROP POLICY IF EXISTS "Wholesale user can read own orders" ON "public"."Order";
CREATE POLICY "Wholesale user can read own orders"
  ON "public"."Order"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND "wholesaleUserId" IN (
      SELECT id FROM "public"."WholesaleUser"
      WHERE "authId" = auth.uid()::text
    )
  );

-- OrderItem: accesible sólo si la orden padre es del usuario.
-- Mismo arreglo: el LEFT JOIN + `OR o."wholesaleUserId" IS NULL` filtraba los
-- items de todos los pedidos retail. Ahora es INNER JOIN y sin cláusula NULL.
DROP POLICY IF EXISTS "Wholesale user can read own order items" ON "public"."OrderItem";
CREATE POLICY "Wholesale user can read own order items"
  ON "public"."OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND "orderId" IN (
      SELECT o.id FROM "public"."Order" o
      JOIN "public"."WholesaleUser" wu ON wu.id = o."wholesaleUserId"
      WHERE wu."authId" = auth.uid()::text
    )
  );

-- ImageBandeja: sin acceso anon (solo admin vía service_role)
-- No creamos política de SELECT → acceso denegado por defecto con RLS activo

-- ═══════════════════════════════════════════
-- TABLAS AGREGADAS DESPUÉS DEL LOCKDOWN ORIGINAL
-- (aplicado 2026-08-04 tras alerta rls_disabled_in_public)
-- ═══════════════════════════════════════════

ALTER TABLE "public"."HeroSlide"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PromoPopup" ENABLE ROW LEVEL SECURITY;

-- HeroSlide: solo slides activos son públicamente legibles
CREATE POLICY "Public can read active hero slides"
  ON "public"."HeroSlide"
  FOR SELECT
  USING (active = true);

-- PromoPopup: solo legible cuando el popup está activo
CREATE POLICY "Public can read active promo popup"
  ON "public"."PromoPopup"
  FOR SELECT
  USING (active = true);

-- ── Franja de Instagram de la home (añadida 2026-08-16) ──────────
ALTER TABLE "public"."InstagramPost" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active instagram posts"
  ON "public"."InstagramPost"
  FOR SELECT
  USING (active = true);

-- ═══════════════════════════════════════════
-- NOTA IMPORTANTE SOBRE ESCRITURA
-- ═══════════════════════════════════════════
-- No creamos políticas INSERT/UPDATE/DELETE para anon ni authenticated
-- en ninguna tabla. Todo write va por Prisma (service_role) desde
-- las API routes de Next.js. Esto es intencional y seguro:
-- el service_role bypasa RLS por definición en Supabase.

-- ═══════════════════════════════════════════
-- TABLAS QUE SE HABÍAN ACTIVADO SÓLO EN VIVO
-- (documentadas aquí el 2026-08-21 al auditar pg_policies; el estado real de
--  Postgres ya las tenía así, esto sólo pone el fichero al día para que el
--  repo sea la fuente de verdad y una restauración no las deje sin RLS)
-- ═══════════════════════════════════════════

ALTER TABLE "public"."ProductVariant"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DiscountProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MarqueeMessage"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LoginAttempt"    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variant_public" ON "public"."ProductVariant";
CREATE POLICY "product_variant_public"
  ON "public"."ProductVariant"
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "discount_product_public" ON "public"."DiscountProduct";
CREATE POLICY "discount_product_public"
  ON "public"."DiscountProduct"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "marquee_public" ON "public"."MarqueeMessage";
CREATE POLICY "marquee_public"
  ON "public"."MarqueeMessage"
  FOR SELECT
  USING (active = true);

-- LoginAttempt: RLS activo y CERO políticas a propósito → deny-all para anon.
-- Sólo se escribe/lee desde el servidor vía Prisma. Igual que ImageBandeja.

-- ── Formulario público de /contacto (añadida 2026-08-21) ──────────
-- ContactSubmission: RLS activo y CERO políticas a propósito → deny-all para
-- anon/authenticated. El formulario público escribe vía POST /api/contacto,
-- que usa Prisma (service_role) desde el servidor, nunca supabase-js desde el
-- cliente. Mismo patrón que LoginAttempt: nadie necesita leer/escribir esto
-- con la anon key.
ALTER TABLE "public"."ContactSubmission" ENABLE ROW LEVEL SECURITY;
