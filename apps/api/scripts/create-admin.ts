// Cria (ou promove) o usuário administrador a partir de ADMIN_*. Pode rodar em produção.
import { existsSync } from 'node:fs';
import { createPrismaClient } from '../src/lib/db';
import { createPasswordHasher } from '../src/lib/password';
import { ensureAdmin, readAdminEnv } from '../src/lib/admin-bootstrap';

async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL não definido');

  const prisma = createPrismaClient(databaseUrl);
  try {
    const passwords = createPasswordHasher(Number(process.env.ARGON2_MEMORY_KIB) || 19456);
    const result = await ensureAdmin(prisma, passwords, readAdminEnv());
    console.log(
      `✅ Admin ${result.email} ${result.created ? 'criado' : 'promovido/mantido como ADMIN'}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌', error instanceof Error ? error.message : error);
  process.exit(1);
});
