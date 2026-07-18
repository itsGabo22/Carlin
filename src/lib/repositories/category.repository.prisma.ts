import { prisma } from '@/lib/prisma';
import type { Category } from '@/types';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getChildren(parentSlug: string): Promise<Category[]>;
  getTree(): Promise<Category[]>;
}

class PrismaCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return prisma.category.findMany({
      include: { children: true }
    });
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true }
    });
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parent: { slug: parentSlug } }
    });
  }

  async getTree(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parentId: null },
      include: { children: true }
    });
  }
}

export const categoryRepository: ICategoryRepository = new PrismaCategoryRepository();
