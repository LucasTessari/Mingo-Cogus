import { effectivePriceCents, toSearchText, type ProductSummary } from '@mingo/shared';
import type { Prisma } from '../../generated/prisma/client';

// Campos derivados do produto. Toda escrita de produto passa por aqui
// (o CHECK no banco rejeita qualquer effectivePriceCents inconsistente).
export const derivedProductFields = (product: {
  name: string;
  description: string;
  priceCents: number;
  salePriceCents?: number | null;
  species?: string | null;
  strain?: string | null;
}) => ({
  effectivePriceCents: effectivePriceCents(product),
  searchText: toSearchText(product.name, product.description, product.species, product.strain),
});

// Produto visível na loja: ativo, não arquivado e em categoria ativa
export const STOREFRONT_PRODUCT = {
  isActive: true,
  archivedAt: null,
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

const coverImage = {
  select: { url: true },
  orderBy: { position: 'asc' },
  take: 1,
} satisfies Prisma.Product$imagesArgs;

export const productSummarySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  priceCents: true,
  salePriceCents: true,
  effectivePriceCents: true,
  stock: true,
  featured: true,
  awardWinning: true,
  tags: true,
  species: true,
  strain: true,
  potency: true,
  cultivationMethod: true,
  quantityLabel: true,
  ratingAvg: true,
  reviewCount: true,
  category: { select: { id: true, slug: true, name: true } },
  images: coverImage,
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect }>;

export const toProductSummary = ({ images, ...product }: ProductSummaryRow): ProductSummary => ({
  ...product,
  imageUrl: images[0]?.url ?? null,
});
