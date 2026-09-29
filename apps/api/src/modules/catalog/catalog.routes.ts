import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CULTIVATION_METHODS,
  POTENCIES,
  PRODUCT_TAGS,
  categoryNode,
  productFacets,
  productListQuery,
  productPage,
} from '@mingo/shared';
import { pageArgs, toPage } from '../../lib/pagination';
import { STOREFRONT_PRODUCT, productSummarySelect, toProductSummary } from './product-data';
import { buildProductOrderBy, buildProductWhere, resolveCategoryIds } from './product-query';

const categoryFields = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconKey: true,
  imageUrl: true,
  sortOrder: true,
} as const;

const byDisplayOrder = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];

// Valores únicos na ordem em que aparecem (ou na ordem de `reference`)
const unique = <T>(values: Array<T | null>, reference?: readonly T[]): T[] => {
  const present = new Set(values.filter((value): value is T => value !== null));
  return reference
    ? reference.filter((value) => present.has(value))
    : [...present].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
};

export const catalogRoutes: FastifyPluginAsyncZod = async (app) => {
  // Árvore de categorias ativas (categorias de topo e subcategorias)
  app.get('/categories', { schema: { response: { 200: z.array(categoryNode) } } }, async () =>
    app.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: byDisplayOrder,
      select: {
        ...categoryFields,
        children: { where: { isActive: true }, orderBy: byDisplayOrder, select: categoryFields },
      },
    }),
  );

  app.get(
    '/products',
    { schema: { querystring: productListQuery, response: { 200: productPage } } },
    async (request) => {
      const query = request.query;
      const categoryIds = await resolveCategoryIds(app.prisma, query.category);
      const where = buildProductWhere(query, categoryIds);

      const [products, total] = await Promise.all([
        app.prisma.product.findMany({
          where,
          orderBy: buildProductOrderBy(query),
          ...pageArgs(query.page, query.limit),
          select: productSummarySelect,
        }),
        app.prisma.product.count({ where }),
      ]);
      return toPage(products.map(toProductSummary), total, query.page, query.limit);
    },
  );

  // Opções dos filtros da listagem, calculadas sobre todo o catálogo visível
  app.get('/products/facets', { schema: { response: { 200: productFacets } } }, async () => {
    const products = await app.prisma.product.findMany({
      where: STOREFRONT_PRODUCT,
      select: {
        tags: true,
        species: true,
        strain: true,
        potency: true,
        cultivationMethod: true,
        effectivePriceCents: true,
        category: {
          select: {
            slug: true,
            name: true,
            sortOrder: true,
            parent: { select: { slug: true, name: true, sortOrder: true } },
          },
        },
      },
    });

    // Categorias com produtos, cada subcategoria logo abaixo da sua categoria mãe
    const categories = new Map<string, { slug: string; name: string; order: [number, number] }>();
    for (const { category } of products) {
      const { parent } = category;
      if (parent) {
        categories.set(parent.slug, {
          slug: parent.slug,
          name: parent.name,
          order: [parent.sortOrder, -1],
        });
      }
      const order: [number, number] = parent
        ? [parent.sortOrder, category.sortOrder]
        : [category.sortOrder, -1];
      categories.set(category.slug, { slug: category.slug, name: category.name, order });
    }

    const prices = products.map((product) => product.effectivePriceCents);
    return {
      categories: [...categories.values()]
        .sort(
          (a, b) =>
            a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.name.localeCompare(b.name),
        )
        .map(({ slug, name }) => ({ slug, name })),
      tags: unique(
        products.flatMap((product) => product.tags),
        PRODUCT_TAGS,
      ),
      species: unique(products.map((product) => product.species)),
      strains: unique(products.map((product) => product.strain)),
      potencies: unique(
        products.map((product) => product.potency),
        POTENCIES,
      ),
      cultivationMethods: unique(
        products.map((product) => product.cultivationMethod),
        CULTIVATION_METHODS,
      ),
      priceRange: {
        minCents: prices.length ? Math.min(...prices) : 0,
        maxCents: prices.length ? Math.max(...prices) : 0,
      },
    };
  });
};
