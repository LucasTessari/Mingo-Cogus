import { z } from 'zod';
import {
  CULTIVATION_METHODS,
  POTENCIES,
  PRODUCT_SORT_FIELDS,
  PRODUCT_TAGS,
  SORT_ORDERS,
} from '../enums';
import {
  paginated,
  queryEnum,
  queryEnumList,
  queryEnumWithDefault,
  queryFlag,
  queryInt,
  queryIntWithDefault,
  queryText,
} from './common';

export const MAX_PAGE_SIZE = 48;
export const DEFAULT_PAGE_SIZE = 12;

// Parâmetros da listagem de produtos (mesmos nomes na URL do site e na API).
// minPrice/maxPrice são centavos.
export const productListQuery = z.object({
  search: queryText(100),
  category: queryText(80),
  minPrice: queryInt(0),
  maxPrice: queryInt(0),
  inStock: queryFlag,
  featured: queryFlag,
  onSale: queryFlag,
  awardWinning: queryFlag,
  tags: queryEnumList(PRODUCT_TAGS),
  species: queryText(80),
  strain: queryText(80),
  potency: queryEnum(POTENCIES),
  cultivationMethod: queryEnum(CULTIVATION_METHODS),
  sortBy: queryEnumWithDefault(PRODUCT_SORT_FIELDS, 'createdAt'),
  order: queryEnumWithDefault(SORT_ORDERS, 'desc'),
  page: queryIntWithDefault(1, 1),
  limit: queryIntWithDefault(1, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
});
export type ProductListQuery = z.output<typeof productListQuery>;
export type ProductListParams = Partial<ProductListQuery>;

export const categoryRef = z.object({ id: z.string(), slug: z.string(), name: z.string() });

export const productSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  salePriceCents: z.number().int().nullable(),
  effectivePriceCents: z.number().int(),
  stock: z.number().int(),
  featured: z.boolean(),
  awardWinning: z.boolean(),
  tags: z.array(z.enum(PRODUCT_TAGS)),
  species: z.string().nullable(),
  strain: z.string().nullable(),
  potency: z.enum(POTENCIES).nullable(),
  cultivationMethod: z.enum(CULTIVATION_METHODS).nullable(),
  quantityLabel: z.string().nullable(),
  ratingAvg: z.number().nullable(),
  reviewCount: z.number().int(),
  imageUrl: z.string().nullable(),
  category: categoryRef,
});
export type ProductSummary = z.infer<typeof productSummary>;

export const productPage = paginated(productSummary);
export type ProductPage = z.infer<typeof productPage>;

// Opções dos filtros, calculadas sobre todo o catálogo visível
export const productFacets = z.object({
  categories: z.array(z.object({ slug: z.string(), name: z.string() })),
  tags: z.array(z.enum(PRODUCT_TAGS)),
  species: z.array(z.string()),
  strains: z.array(z.string()),
  potencies: z.array(z.enum(POTENCIES)),
  cultivationMethods: z.array(z.enum(CULTIVATION_METHODS)),
  priceRange: z.object({ minCents: z.number().int(), maxCents: z.number().int() }),
});
export type ProductFacets = z.infer<typeof productFacets>;

export const categoryBase = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  iconKey: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
});

// Árvore de categorias ativas: categorias de topo com suas subcategorias
export const categoryNode = categoryBase.extend({ children: z.array(categoryBase) });
export type CategoryNode = z.infer<typeof categoryNode>;
