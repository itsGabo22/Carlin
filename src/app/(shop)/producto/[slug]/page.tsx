import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { productRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductGrid } from '@/components/catalog/ProductGrid';

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.getBySlug(slug);
  return {
    title: product ? `${product.name} | CARLIN Cosméticos` : 'Producto no encontrado',
    description: product?.description || 'Descubre los mejores productos de belleza en CARLIN Cosméticos.',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      <ProductDetailClient product={product} priceLevel={sessionResult.priceLevel} />

      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-brand-pink-light/20">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>También te puede interesar</span>
          </h2>
          <ProductGrid products={relatedProducts} priceLevel={sessionResult.priceLevel} />
        </section>
      )}
    </div>
  );
}
