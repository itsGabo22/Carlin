import { prisma } from '../prisma';

export class ProductRepository {
  static async findAll() {
    return prisma.product.findMany({
      where: { active: true },
      include: { category: true, tags: { include: { tag: true } } },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: { category: true, tags: { include: { tag: true } } },
    });
  }
}
