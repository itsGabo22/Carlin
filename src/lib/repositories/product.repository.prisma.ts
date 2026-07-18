import { prisma } from '@/lib/prisma';
import type { Product, Category, Tag, Discount, Brand } from '@/types';
import { Prisma } from '@prisma/client';

export interface GetProductsOptions {
  categorySlug?: string;
  brandSlug?: string;
  tagSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  active?: boolean;
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

    const where: Prisma.ProductWhereInput = { active };

    if (options.categorySlug) {
      // Find category and all its children via parentId
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { slug: options.categorySlug },
            { parent: { slug: options.categorySlug } }
          ]
        },
        select: { id: true }
      });
      const categoryIds = categories.map(c => c.id);
      
      where.categoryId = { in: categoryIds };
    }

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
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
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
