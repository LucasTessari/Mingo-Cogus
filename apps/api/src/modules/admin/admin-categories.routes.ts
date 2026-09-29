import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { adminCategory, categoryInput, idParam, slugify } from '@mingo/shared';
import { Prisma } from '../../generated/prisma/client';
import { AppError, notFound } from '../../lib/app-error';

type CategoryData = z.output<typeof categoryInput>;

const categoryListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconKey: true,
  imageUrl: true,
  sortOrder: true,
  isActive: true,
  parentId: true,
  _count: { select: { products: true, children: true } },
} satisfies Prisma.CategorySelect;

type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categoryListSelect }>;

const toAdminCategory = ({ _count, ...category }: CategoryRow) => ({
  ...category,
  productCount: _count.products,
  childCount: _count.children,
});

const toCategoryFields = ({ slug, ...data }: CategoryData) => ({
  ...data,
  slug: slug || slugify(data.name),
  description: data.description ?? null,
  iconKey: data.iconKey ?? null,
  imageUrl: data.imageUrl ?? null,
  parentId: data.parentId ?? null,
});

export const adminCategoryRoutes: FastifyPluginAsyncZod = async (app) => {
  // Categorias têm no máximo 2 níveis: a mãe precisa ser de topo e a categoria editada não pode ter filhas
  const validateParent = async (parentId: string | null | undefined, categoryId?: string) => {
    if (!parentId) return;
    if (parentId === categoryId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Uma categoria não pode ser mãe de si mesma');
    }
    const parent = await app.prisma.category.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    if (!parent) throw new AppError(400, 'VALIDATION_ERROR', 'Categoria mãe não encontrada');
    if (parent.parentId)
      throw new AppError(400, 'VALIDATION_ERROR', 'A categoria mãe precisa ser de topo');
    if (categoryId && (await app.prisma.category.count({ where: { parentId: categoryId } })) > 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Uma categoria com subcategorias não pode virar subcategoria',
      );
    }
  };

  const withSlugCheck = async <T>(write: () => Promise<T>) => {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'SLUG_TAKEN', 'Já existe uma categoria com esse slug');
      }
      throw error;
    }
  };

  app.get('/categories', { schema: { response: { 200: z.array(adminCategory) } } }, async () => {
    const categories = await app.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: categoryListSelect,
    });
    return categories.map(toAdminCategory);
  });

  app.post(
    '/categories',
    { schema: { body: categoryInput, response: { 201: adminCategory } } },
    async (request, reply) => {
      await validateParent(request.body.parentId);
      const category = await withSlugCheck(() =>
        app.prisma.category.create({
          data: toCategoryFields(request.body),
          select: categoryListSelect,
        }),
      );
      return reply.status(201).send(toAdminCategory(category));
    },
  );

  app.put(
    '/categories/:id',
    { schema: { params: idParam, body: categoryInput, response: { 200: adminCategory } } },
    async (request) => {
      await validateParent(request.body.parentId, request.params.id);
      const category = await withSlugCheck(() =>
        app.prisma.category.update({
          where: { id: request.params.id },
          data: toCategoryFields(request.body),
          select: categoryListSelect,
        }),
      );
      return toAdminCategory(category);
    },
  );

  app.delete('/categories/:id', { schema: { params: idParam } }, async (request, reply) => {
    const category = await app.prisma.category.findUnique({
      where: { id: request.params.id },
      select: categoryListSelect,
    });
    if (!category) throw notFound('Categoria não encontrada');
    if (category._count.products > 0 || category._count.children > 0) {
      throw new AppError(
        409,
        'CATEGORY_NOT_EMPTY',
        'Remova ou mova os produtos e subcategorias antes de excluir',
      );
    }
    await app.prisma.category.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });
};
