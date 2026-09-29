import { createPrismaClient } from '../../src/lib/db';

export const prisma = createPrismaClient(process.env.DATABASE_URL!);

// Limpa todas as tabelas. Só roda em um banco cujo nome termina em "_test".
export async function resetDb() {
  const [row] = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
  const db = row?.db ?? '';
  if (!db.endsWith('_test')) throw new Error(`resetDb recusado: banco "${db}" não é de teste`);

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe('ALTER SEQUENCE order_number_seq RESTART WITH 1');
}
