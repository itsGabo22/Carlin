export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Discount {
  id: string;
  percentage: number;
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
  categoryId?: string | null;
  productId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  retailPrice: number;
  wholesalePrice: number;
  distributorPrice: number;
  comparePrice?: number | null;
  sku?: string | null;
  stock: number;
  unit?: string | null;
  tones: string[];
  imageUrls: string[];
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  brandId?: string | null;
  brand?: Brand | null;
  tags: Tag[];
  discounts: Discount[];
}
