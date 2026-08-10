import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { productRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ProductGrid } from '@/components/catalog/ProductGrid';

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.getBySlug(slug);
  return {
    title: product ? product.name : 'Producto no encontrado',
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const product = await productRepository.getBySlug(slug);

  if (!product) {
    notFound();
  }

  const [config, related] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.getAll({ categorySlug: product.category.slug, pageSize: 8 }),
  ]);

  const safeConfig = config || ({ inactivityDays: 30 } as any);
  const sessionResult = await getSessionResult(safeConfig);

  const relatedProducts = related.products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.imageUrls} productName={product.name} />
        <ProductInfo product={product} priceLevel={sessionResult.priceLevel} />
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
            También te puede interesar
          </h2>
          <ProductGrid products={relatedProducts} priceLevel={sessionResult.priceLevel} />
        </section>
      )}
    </div>
  );
}
