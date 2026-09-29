import { randomUUID } from 'node:crypto';
import type { Role } from '@mingo/shared';
import type { Prisma } from '../../src/generated/prisma/client';
import { createPasswordHasher } from '../../src/lib/password';
import { derivedProductFields } from '../../src/modules/catalog/product-data';
import type { App } from '../../src/app';
import { SESSION_COOKIE } from '../../src/plugins/auth';
import { prisma } from './db';

const passwords = createPasswordHasher(1024);
export const DEFAULT_PASSWORD = 'senha-segura-123';

const uniqueSuffix = () => randomUUID().slice(0, 8);

export async function createCategory(overrides: Partial<Prisma.CategoryUncheckedCreateInput> = {}) {
  const suffix = uniqueSuffix();
  return prisma.category.create({
    data: { name: `Categoria ${suffix}`, slug: `categoria-${suffix}`, ...overrides },
  });
}

type ProductOverrides = Partial<
  Omit<Prisma.ProductUncheckedCreateInput, 'effectivePriceCents' | 'searchText'>
>;

export async function createProduct(overrides: ProductOverrides = {}) {
  const suffix = uniqueSuffix();
  const categoryId = overrides.categoryId ?? (await createCategory()).id;
  const fields = {
    name: `Produto ${suffix}`,
    description: 'Descrição do produto',
    priceCents: 1000,
    stock: 10,
    ...overrides,
  };
  return prisma.product.create({
    data: {
      slug: `produto-${suffix}`,
      ...fields,
      categoryId,
      ...derivedProductFields(fields),
      images: { create: [{ url: '/placeholders/cogumelo.svg', position: 0 }] },
    },
  });
}

export async function createUser({
  role = 'USER',
  email = `user-${uniqueSuffix()}@teste.local`,
  password = DEFAULT_PASSWORD,
}: { role?: Role; email?: string; password?: string } = {}) {
  return prisma.user.create({
    data: {
      email,
      name: role === 'ADMIN' ? 'Admin Teste' : 'Cliente Teste',
      role,
      passwordHash: await passwords.hash(password),
    },
  });
}

// Cookie de sessão assinado diretamente (mais rápido que passar pelo login)
export const sessionCookie = (app: App, user: { id: string; tokenVersion: number }) =>
  `${SESSION_COOKIE}=${app.jwt.sign({ sub: user.id, tv: user.tokenVersion })}`;
