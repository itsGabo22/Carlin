import { prisma } from '@/lib/prisma';
import type { Product, Category, Tag, Discount, Brand } from '@/types';
import { Prisma } from '@prisma/client';

export interface GetProductsOptions {
  categorySlug?: string;
  /**
   * Filtra por un conjunto explícito de categorías (la categoría vista y todas
   * sus descendientes). Se usa en el catálogo para soportar profundidad
   * arbitraria; `categorySlug` solo baja 3 niveles fijos.
   */
  categoryIds?: string[];
  brandSlug?: string;
  tagSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  active?: boolean;
  /** Orden del listado; por defecto destacados primero y luego los más nuevos. */
  sort?: 'default' | 'latest' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface ProductsResult {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
}

export interface IProductRepository {
  getAll(options?: GetProductsOptions): Promise<ProductsResult>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(): Promise<Product[]>;
  getByBrand(brandSlug: string, options?: GetProductsOptions): Promise<ProductsResult>;
  search(query: string, options?: GetProductsOptions): Promise<ProductsResult>;
}

/** Traduce la opción de orden a un orderBy de Prisma. */
function buildOrderBy(sort: GetProductsOptions['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'latest':
      return [{ createdAt: 'desc' }];
    case 'price-asc':
      return [{ retailPrice: 'asc' }];
    case 'price-desc':
      return [{ retailPrice: 'desc' }];
    case 'name-asc':
      return [{ name: 'asc' }];
    default:
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
  }
}

function mapProduct(p: any): Product {
  return {
    ...p,
    retailPrice: Number(p.retailPrice),
    wholesalePrice: Number(p.wholesalePrice),
    distributorPrice: Number(p.distributorPrice),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    tags: p.tags?.map((pt: any) => pt.tag) || [],
    discounts: (p.discounts || []).map((d: any) => ({
      ...d,
      percentage: Number(d.percentage),
    })),
  };
}

class PrismaProductRepository implements IProductRepository {
  async getAll(options: GetProductsOptions = {}): Promise<ProductsResult> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 24;
    const active = options.active !== undefined ? options.active : true;

    const where: Prisma.ProductWhereInput = {
      active,
      ...(options.categoryIds && { categoryId: { in: options.categoryIds } }),
      ...(!options.categoryIds && options.categorySlug && {
        OR: [
          { category: { slug: options.categorySlug } },
          { category: { parent: { slug: options.categorySlug } } },
          { category: { parent: { parent: { slug: options.categorySlug } } } },
        ]
      })
    };

    if (options.brandSlug) {
      where.brand = { slug: options.brandSlug };
    }

    if (options.tagSlug) {
      where.tags = { some: { tag: { slug: options.tagSlug } } };
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.retailPrice = {};
      if (options.minPrice !== undefined) {
        where.retailPrice.gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        where.retailPrice.lte = options.maxPrice;
      }
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { include: { parent: true } },
          brand: true,
          tags: { include: { tag: true } },
          discounts: { where: { active: true } },
        },
        orderBy: buildOrderBy(options.sort),
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      products: products.map(mapProduct),
      total,
      page,
      pages: Math.ceil(total / pageSize),
      pageSize
    };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { include: { parent: true } },
        brand: true,
        tags: { include: { tag: true } },
        discounts: { where: { active: true } },
      }
    });
    return product ? mapProduct(product) : null;
  }

  async getFeatured(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { featured: true, active: true },
      take: 8,
      include: {
        category: { include: { parent: true } },
        brand: true,
        tags: { include: { tag: true } },
        discounts: { where: { active: true } },
      }
    });
    return products.map(mapProduct);
  }

  async getByBrand(brandSlug: string, options: GetProductsOptions = {}): Promise<ProductsResult> {
    return this.getAll({ ...options, brandSlug });
  }

  async search(query: string, options: GetProductsOptions = {}): Promise<ProductsResult> {
    return this.getAll({ ...options, search: query });
  }
}

export const productRepository: IProductRepository = new PrismaProductRepository();
