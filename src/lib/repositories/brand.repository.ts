import { prisma } from '@/lib/prisma';
import type { Brand } from '@/types';

export interface IBrandRepository {
  getAll(): Promise<Brand[]>;
  getBySlug(slug: string): Promise<Brand | null>;
}

class PrismaBrandRepository implements IBrandRepository {
  async getAll(): Promise<Brand[]> {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getBySlug(slug: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { slug }
    });
  }
}

export const brandRepository: IBrandRepository = new PrismaBrandRepository();
