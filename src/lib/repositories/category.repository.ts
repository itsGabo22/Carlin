import { prisma } from '../prisma';

export class CategoryRepository {
  static async findAll() {
    return prisma.category.findMany({
      include: { children: true },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true, products: true },
    });
  }
}
