import sharp from 'sharp';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * REGLA CRÍTICA DEL PROYECTO — no romper:
 *
 * Pasar un `Buffer` crudo a `.upload()` de Supabase corrompe el binario en el
 * runtime de Node 24 de Vercel (no se reproduce en local). Todo binario tiene
 * que envolverse en `new Blob([buffer], { type })` antes de subirlo.
 *
 * Por eso TODA subida a Supabase Storage debe pasar por este módulo y nunca
 * llamar a `.upload()` con un Buffer directamente.
 */

/**
 * Blob-wrap obligatorio antes de cualquier `.upload()` de Supabase.
 * Usar esto (o `uploadBinary`) siempre; nunca pasar el Buffer crudo.
 */
export function toBlob(buffer: Buffer, contentType: string): Blob {
  return new Blob([new Uint8Array(buffer)], { type: contentType });
}

type ResizeOptions = {
  width: number;
  height: number;
  fit?: keyof sharp.FitEnum;
  withoutEnlargement?: boolean;
};

/**
 * Procesa una imagen con sharp (→ WebP) y la sube a Supabase Storage.
 * Devuelve la URL pública. Lanza un Error con mensaje legible si falla.
 */
export async function processAndUploadImage({
  file,
  bucket,
  path,
  resize,
  quality = 82,
  upsert = false,
}: {
  file: File;
  bucket: string;
  path: string;
  resize?: ResizeOptions;
  quality?: number;
  upsert?: boolean;
}): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  let pipeline = sharp(Buffer.from(arrayBuffer));
  if (resize) {
    pipeline = pipeline.resize(resize.width, resize.height, {
      fit: resize.fit ?? 'inside',
      withoutEnlargement: resize.withoutEnlargement ?? false,
    });
  }
  const processed = await pipeline.webp({ quality }).toBuffer();

  return uploadBinary({
    buffer: processed,
    bucket,
    path,
    contentType: 'image/webp',
    upsert,
  });
}

/**
 * Sube un binario ya procesado (o un archivo que no pasa por sharp, ej. video)
 * a Supabase Storage aplicando el Blob-wrap obligatorio.
 */
export async function uploadBinary({
  buffer,
  bucket,
  path,
  contentType,
  upsert = false,
}: {
  buffer: Buffer;
  bucket: string;
  path: string;
  contentType: string;
  upsert?: boolean;
}): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  const blob = toBlob(buffer, contentType);

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, blob, { contentType, upsert });

  if (error) {
    console.error('[SUPABASE UPLOAD ERROR]', {
      message: error.message,
      bucket,
      path,
      contentType,
      size: buffer.byteLength,
    });
    throw new Error(`No se pudo subir el archivo: ${error.message}`);
  }

  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Nombre de archivo seguro para Storage, derivado del nombre original. */
export function safeStorageName(originalName: string): string {
  return originalName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'archivo';
}
