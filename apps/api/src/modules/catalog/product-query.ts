import { escapeLike, toSearchText, type ProductListQuery } from '@mingo/shared';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { STOREFRONT_PRODUCT } from './product-data';

// Filtro da listagem da loja. `categoryIds` já inclui as subcategorias da categoria pedida.
export function buildProductWhere(
  query: Partial<ProductListQuery>,
  categoryIds?: string[],
): Prisma.ProductWhereInput {
  const conditions: Prisma.ProductWhereInput[] = [STOREFRONT_PRODUCT];

  if (categoryIds) conditions.push({ categoryId: { in: categoryIds } });
  if (query.search) {
    // Busca literal (curingas escapados), sem acentos e sem diferenciar maiúsculas
    conditions.push({ searchText: { contains: escapeLike(toSearchText(query.search)) } });
  }
  if (query.minPrice !== undefined)
    conditions.push({ effectivePriceCents: { gte: query.minPrice } });
  if (query.maxPrice !== undefined)
    conditions.push({ effectivePriceCents: { lte: query.maxPrice } });
  if (query.inStock) conditions.push({ stock: { gt: 0 } });
  if (query.featured) conditions.push({ featured: true });
  if (query.onSale) conditions.push({ salePriceCents: { not: null } });
  if (query.awardWinning) conditions.push({ awardWinning: true });
  if (query.tags?.length) conditions.push({ tags: { hasSome: query.tags } });
  if (query.species) conditions.push({ species: query.species });
  if (query.strain) conditions.push({ strain: query.strain });
  if (query.potency) conditions.push({ potency: query.potency });
  if (query.cultivationMethod) conditions.push({ cultivationMethod: query.cultivationMethod });

  return { AND: conditions };
}

// Ordenação pedida + desempates estáveis (mais recente, depois id) para a paginação não oscilar
export function buildProductOrderBy({
  sortBy = 'createdAt',
  order = 'desc',
}: Partial<Pick<ProductListQuery, 'sortBy' | 'order'>>): Prisma.ProductOrderByWithRelationInput[] {
  const primary: Prisma.ProductOrderByWithRelationInput =
    sortBy === 'rating'
      ? { ratingAvg: { sort: order, nulls: 'last' } }
      : sortBy === 'price'
        ? { effectivePriceCents: order }
        : { [sortBy]: order };
  return [primary, { createdAt: 'desc' }, { id: 'asc' }];
}

// Ids da categoria (por slug) e das suas subcategorias ativas; [] se não existir
export async function resolveCategoryIds(
  prisma: PrismaClient,
  slug: string | undefined,
): Promise<string[] | undefined> {
  if (!slug) return undefined;
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, children: { where: { isActive: true }, select: { id: true } } },
  });
  return category ? [category.id, ...category.children.map((child) => child.id)] : [];
}
