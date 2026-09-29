import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  adminProduct,
  adminProductListQuery,
  adminProductPage,
  escapeLike,
  idParam,
  productInput,
  slugify,
  toSearchText,
  type AdminProduct,
} from '@mingo/shared';
import { Prisma } from '../../generated/prisma/client';
import { AppError, notFound } from '../../lib/app-error';
import { toIso } from '../../lib/dates';
import { pageArgs, toPage } from '../../lib/pagination';
import { derivedProductFields } from '../catalog/product-data';

type ProductData = z.output<typeof productInput>;

const adminProductInclude = {
  category: { select: { id: true, slug: true, name: true } },
  images: { orderBy: { position: 'asc' }, select: { url: true, alt: true } },
} satisfies Prisma.ProductInclude;

type AdminProductRow = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

const toAdminProduct = (product: AdminProductRow): AdminProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  priceCents: product.priceCents,
  salePriceCents: product.salePriceCents,
  stock: product.stock,
  featured: product.featured,
  awardWinning: product.awardWinning,
  isActive: product.isActive,
  archivedAt: toIso(product.archivedAt),
  tags: product.tags,
  species: product.species,
  strain: product.strain,
  potency: product.potency,
  cultivationMethod: product.cultivationMethod,
  quantityLabel: product.quantityLabel,
  origin: product.origin,
  images: product.images,
  category: product.category,
  categoryId: product.categoryId,
  updatedAt: product.updatedAt.toISOString(),
});

const STATUS_FILTERS: Record<string, Prisma.ProductWhereInput> = {
  active: { isActive: true, archivedAt: null },
  inactive: { isActive: false, archivedAt: null },
  archived: { archivedAt: { not: null } },
  all: {},
};

// Campos gravados a partir do formulário (imagens são tratadas à parte)
const toProductFields = ({ images: _images, slug, ...data }: ProductData) => ({
  ...data,
  slug: slug || slugify(data.name),
  salePriceCents: data.salePriceCents ?? null,
  species: data.species ?? null,
  strain: data.strain ?? null,
  potency: data.potency ?? null,
  cultivationMethod: data.cultivationMethod ?? null,
  quantityLabel: data.quantityLabel ?? null,
  origin: data.origin ?? null,
  ...derivedProductFields(data),
});

const toImageRows = (images: ProductData['images']) =>
  images.map((image, position) => ({ url: image.url, alt: image.alt ?? null, position }));

const slugTaken = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' &&
  JSON.stringify(error.meta ?? {}).includes('slug');

const productResponse = { 200: adminProduct };

export const adminProductRoutes: FastifyPluginAsyncZod = async (app) => {
  const ensureCategory = async (categoryId: string) => {
    if (
      !(await app.prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))
    ) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Categoria não encontrada');
    }
  };

  const withSlugCheck = async <T>(write: () => Promise<T>) => {
    try {
      return await write();
    } catch (error) {
      if (slugTaken(error))
        throw new AppError(409, 'SLUG_TAKEN', 'Já existe um produto com esse slug');
      throw error;
    }
  };

  app.get(
    '/products',
    { schema: { querystring: adminProductListQuery, response: { 200: adminProductPage } } },
    async (request) => {
      const { search, status, categoryId, page, limit } = request.query;
      const where: Prisma.ProductWhereInput = {
        ...STATUS_FILTERS[status ?? 'active'],
        ...(categoryId && { categoryId }),
        ...(search && { searchText: { contains: escapeLike(toSearchText(search)) } }),
      };
      const [products, total] = await Promise.all([
        app.prisma.product.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          ...pageArgs(page, limit),
          include: adminProductInclude,
        }),
        app.prisma.product.count({ where }),
      ]);
      return toPage(products.map(toAdminProduct), total, page, limit);
    },
  );

  app.get(
    '/products/:id',
    { schema: { params: idParam, response: productResponse } },
    async (request) => {
      const product = await app.prisma.product.findUnique({
        where: { id: request.params.id },
        include: adminProductInclude,
      });
      if (!product) throw notFound('Produto não encontrado');
      return toAdminProduct(product);
    },
  );

  app.post(
    '/products',
    { schema: { body: productInput, response: { 201: adminProduct } } },
    async (request, reply) => {
      await ensureCategory(request.body.categoryId);
      const product = await withSlugCheck(() =>
        app.prisma.product.create({
          data: {
            ...toProductFields(request.body),
            images: { create: toImageRows(request.body.images) },
          },
          include: adminProductInclude,
        }),
      );
      return reply.status(201).send(toAdminProduct(product));
    },
  );

  // Atualização completa (o formulário sempre envia todos os campos); imagens são substituídas
  app.put(
    '/products/:id',
    { schema: { params: idParam, body: productInput, response: productResponse } },
    async (request) => {
      await ensureCategory(request.body.categoryId);
      const product = await withSlugCheck(() =>
        app.prisma.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { productId: request.params.id } });
          return tx.product.update({
            where: { id: request.params.id },
            data: {
              ...toProductFields(request.body),
              images: { create: toImageRows(request.body.images) },
            },
            include: adminProductInclude,
          });
        }),
      );
      return toAdminProduct(product);
    },
  );

  app.patch(
    '/products/:id/active',
    {
      schema: {
        params: idParam,
        body: z.object({ isActive: z.boolean() }),
        response: productResponse,
      },
    },
    async (request) =>
      toAdminProduct(
        await app.prisma.product.update({
          where: { id: request.params.id },
          data: { isActive: request.body.isActive },
          include: adminProductInclude,
        }),
      ),
  );

  // Arquiva (sai da loja, mas pedidos antigos continuam referenciando o produto)
  app.delete('/products/:id', { schema: { params: idParam } }, async (request, reply) => {
    await app.prisma.product.update({
      where: { id: request.params.id },
      data: { archivedAt: new Date(), isActive: false },
    });
    return reply.status(204).send();
  });

  app.post(
    '/products/:id/restore',
    { schema: { params: idParam, response: productResponse } },
    async (request) =>
      toAdminProduct(
        await app.prisma.product.update({
          where: { id: request.params.id },
          data: { archivedAt: null },
          include: adminProductInclude,
        }),
      ),
  );
};
