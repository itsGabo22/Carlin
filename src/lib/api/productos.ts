import { NextResponse } from 'next/server';

/**
 * Normalización y validación compartida entre POST /api/admin/productos y
 * PATCH /api/admin/productos/[id].
 *
 * El formulario del admin manda strings vacíos ('') para los campos opcionales
 * y `null` cuando un input numérico queda vacío (JSON.stringify(NaN) === null).
 * Sin normalizar, eso llegaba a Prisma como:
 *   - sku: ''        → viola el índice único al crear el 2º producto sin SKU
 *   - categoryId: '' → viola la foreign key Product_categoryId_fkey
 *   - retailPrice: null → viola NOT NULL
 * y todo eso salía como un 500 crudo.
 */

const emptyToNull = (v: unknown): string | null => {
  if (typeof v !== 'string') return v == null ? null : String(v);
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
};

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

export type NormalizedProduct = {
  name: string;
  slug: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number;
  distributorPrice: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  unit: string | null;
  tones: string[];
  imageUrls: string[];
  featured: boolean;
  active: boolean;
  categoryId: string;
  brandId: string | null;
  tagIds: string[];
};

export type NormalizeResult =
  | { ok: true; data: NormalizedProduct }
  | { ok: false; error: string };

/**
 * Valida y normaliza el body. Devuelve `{ ok: true, data }` o `{ ok: false, error }`
 * con un mensaje en español listo para mostrarle al admin.
 */
export function normalizeProductInput(body: Record<string, unknown>): NormalizeResult {
  const name = emptyToNull(body.name);
  if (!name) return { ok: false, error: 'El nombre del producto es obligatorio.' };

  const slug = emptyToNull(body.slug);
  if (!slug) return { ok: false, error: 'El slug es obligatorio.' };

  const categoryId = emptyToNull(body.categoryId);
  if (!categoryId) return { ok: false, error: 'Debes seleccionar una categoría.' };

  const retailPrice = toNumber(body.retailPrice);
  const wholesalePrice = toNumber(body.wholesalePrice);
  const distributorPrice = toNumber(body.distributorPrice);

  const missingPrice =
    retailPrice === null
      ? 'público'
      : wholesalePrice === null
        ? 'mayorista'
        : distributorPrice === null
          ? 'distribuidor'
          : null;
  if (missingPrice) {
    return { ok: false, error: `El precio ${missingPrice} es obligatorio y debe ser un número válido.` };
  }
  if (retailPrice! < 0 || wholesalePrice! < 0 || distributorPrice! < 0) {
    return { ok: false, error: 'Los precios no pueden ser negativos.' };
  }

  const comparePrice = toNumber(body.comparePrice);
  const stock = toNumber(body.stock);

  const imageUrls = toStringArray(body.imageUrls);
  if (imageUrls.length > 3) {
    return { ok: false, error: 'Máximo 3 imágenes por producto.' };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description: emptyToNull(body.description),
      retailPrice: retailPrice!,
      wholesalePrice: wholesalePrice!,
      distributorPrice: distributorPrice!,
      // comparePrice 0 significa "sin precio comparativo": lo guardamos como null
      comparePrice: comparePrice && comparePrice > 0 ? comparePrice : null,
      sku: emptyToNull(body.sku),
      stock: stock === null ? 0 : Math.trunc(stock),
      unit: emptyToNull(body.unit),
      tones: toStringArray(body.tones),
      imageUrls,
      featured: body.featured === true,
      active: body.active !== false,
      categoryId,
      brandId: emptyToNull(body.brandId),
      tagIds: toStringArray(body.tags),
    },
  };
}

/**
 * Traduce los errores conocidos de Prisma a respuestas JSON con status y
 * mensaje en español. Siempre devuelve un body JSON válido (nunca vacío), para
 * que el frontend no reviente con "Unexpected end of JSON input".
 */
export function productErrorResponse(error: unknown, context: string) {
  console.error(context, error);

  const code = (error as { code?: string })?.code;
  const target = (error as { meta?: { target?: string[] | string } })?.meta?.target;
  const targetStr = Array.isArray(target) ? target.join(', ') : String(target ?? '');

  if (code === 'P2002') {
    if (targetStr.includes('slug')) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese slug. Cambia el nombre o edita el slug manualmente.' },
        { status: 409 },
      );
    }
    if (targetStr.includes('sku')) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese SKU. Usa uno distinto o déjalo vacío.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `Ya existe un producto con ese valor duplicado (${targetStr}).` },
      { status: 409 },
    );
  }

  if (code === 'P2025') {
    return NextResponse.json({ error: 'El producto no existe o fue eliminado.' }, { status: 404 });
  }

  if (code === 'P2003') {
    return NextResponse.json(
      { error: 'La categoría o la marca seleccionada no existe. Vuelve a elegirla y guarda de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: 'Error interno del servidor al guardar el producto. Intenta de nuevo.' },
    { status: 500 },
  );
}
