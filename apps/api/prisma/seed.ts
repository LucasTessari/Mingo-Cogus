// Popula o banco com o catálogo inicial e o usuário admin. Pode rodar várias vezes
// (atualiza pelo slug/email). Recusa rodar em produção.
import { existsSync } from 'node:fs';
import { createPrismaClient, type PrismaClient } from '../src/lib/db';
import { createPasswordHasher } from '../src/lib/password';
import { ensureAdmin, readAdminEnv } from '../src/lib/admin-bootstrap';
import { derivedProductFields } from '../src/modules/catalog/product-data';
import { SEED_CATEGORIES, SEED_PRODUCTS, seedCreatedAt } from './seed-data/catalog';

async function seedCatalog(prisma: PrismaClient) {
  const categoryIds = new Map<string, string>();

  for (const category of SEED_CATEGORIES) {
    const { children = [], ...fields } = category;
    const parent = await prisma.category.upsert({
      where: { slug: fields.slug },
      create: fields,
      update: fields,
    });
    categoryIds.set(parent.slug, parent.id);

    for (const [index, child] of children.entries()) {
      const data = {
        ...child,
        iconKey: category.iconKey,
        sortOrder: index + 1,
        parentId: parent.id,
      };
      const saved = await prisma.category.upsert({
        where: { slug: child.slug },
        create: data,
        update: data,
      });
      categoryIds.set(saved.slug, saved.id);
    }
  }

  for (const [index, product] of SEED_PRODUCTS.entries()) {
    const { categorySlug, image, ...fields } = product;
    const data = {
      ...fields,
      salePriceCents: fields.salePriceCents ?? null,
      ...derivedProductFields(fields),
      categoryId: categoryIds.get(categorySlug)!,
      createdAt: seedCreatedAt(index),
    };
    await prisma.$transaction(async (tx) => {
      const saved = await tx.product.upsert({
        where: { slug: product.slug },
        create: data,
        update: data,
      });
      await tx.productImage.deleteMany({ where: { productId: saved.id } });
      await tx.productImage.create({
        data: { productId: saved.id, url: image, alt: product.name, position: 0 },
      });
    });
  }

  return { categories: categoryIds.size, products: SEED_PRODUCTS.length };
}

async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não roda em produção. Para criar o admin, use `npm run admin:create`.');
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL não definido');

  const admin = readAdminEnv();
  const prisma = createPrismaClient(databaseUrl);
  try {
    const catalog = await seedCatalog(prisma);
    const passwords = createPasswordHasher(Number(process.env.ARGON2_MEMORY_KIB) || 19456);
    const adminResult = await ensureAdmin(prisma, passwords, admin);
    console.log(`✅ ${catalog.categories} categorias e ${catalog.products} produtos`);
    console.log(
      `✅ Admin ${adminResult.email} ${adminResult.created ? 'criado' : 'já existia (mantido como ADMIN)'}`,
    );

    // Cliente de teste opcional (usado pelos testes E2E e visuais)
    const {
      SEED_TEST_CUSTOMER_EMAIL: email,
      SEED_TEST_CUSTOMER_NAME: name,
      SEED_TEST_CUSTOMER_PASSWORD: password,
    } = process.env;
    if (email && password) {
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: name ?? 'Cliente Teste',
          passwordHash: await passwords.hash(password),
        },
        update: {},
      });
      console.log(`✅ Cliente de teste ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌', error instanceof Error ? error.message : error);
  process.exit(1);
});
