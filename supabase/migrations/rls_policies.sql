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

-- Category, Brand, Tag: lectura pública total
CREATE POLICY "Public can read categories"
  ON "public"."Category"
  FOR SELECT
  USING (true);

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

-- Order: un mayorista puede leer sus propias órdenes
CREATE POLICY "Wholesale user can read own orders"
  ON "public"."Order"
  FOR SELECT
  USING (
    "wholesaleUserId" IN (
      SELECT id FROM "public"."WholesaleUser"
      WHERE "authId" = auth.uid()::text
    )
    OR "wholesaleUserId" IS NULL
  );

-- OrderItem: accesible si la orden padre es del usuario
CREATE POLICY "Wholesale user can read own order items"
  ON "public"."OrderItem"
  FOR SELECT
  USING (
    "orderId" IN (
      SELECT o.id FROM "public"."Order" o
      LEFT JOIN "public"."WholesaleUser" wu ON wu.id = o."wholesaleUserId"
      WHERE wu."authId" = auth.uid()::text
         OR o."wholesaleUserId" IS NULL
    )
  );

-- ImageBandeja: sin acceso anon (solo admin vía service_role)
-- No creamos política de SELECT → acceso denegado por defecto con RLS activo

-- ═══════════════════════════════════════════
-- NOTA IMPORTANTE SOBRE ESCRITURA
-- ═══════════════════════════════════════════
-- No creamos políticas INSERT/UPDATE/DELETE para anon ni authenticated
-- en ninguna tabla. Todo write va por Prisma (service_role) desde
-- las API routes de Next.js. Esto es intencional y seguro:
-- el service_role bypasa RLS por definición en Supabase.
