/**
 * Public API for the repository layer.
 * Components and pages import from here — never from the individual files directly.
 */
export type { IProductRepository, GetProductsOptions, ProductsResult } from './product.repository.prisma';
export { productRepository } from './product.repository.prisma';

export type { ICategoryRepository } from './category.repository.prisma';
export { categoryRepository } from './category.repository.prisma';

export type { IBrandRepository } from './brand.repository';
export { brandRepository } from './brand.repository';
