// Banco de E2E do zero: cria (se preciso), aplica migrações, limpa e popula com o seed
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { E2E_ADMIN, E2E_CUSTOMER, E2E_DATABASE_URL } from './e2e-env';

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../api');

async function ensureDatabase(url: URL, database: string) {
  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  maintenance.search = '';
  const admin = new pg.Client({ connectionString: maintenance.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      database,
    ]);
    if (!rowCount) await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }
}

async function truncateAll() {
  const db = new pg.Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  try {
    const { rows } = await db.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
    );
    await db.query(
      `TRUNCATE TABLE ${rows.map((row) => `"${row.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    await db.query('ALTER SEQUENCE order_number_seq RESTART WITH 1');
  } finally {
    await db.end();
  }
}

export async function resetE2EDatabase() {
  const url = new URL(E2E_DATABASE_URL);
  const database = url.pathname.slice(1);
  if (!database.endsWith('_e2e')) {
    throw new Error(`O banco de E2E precisa terminar em "_e2e" (recebido: ${database})`);
  }

  await ensureDatabase(url, database);
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync('npx prisma migrate deploy', { cwd: API_DIR, env, stdio: 'pipe' });
  await truncateAll();
  execSync('npx tsx prisma/seed.ts', {
    cwd: API_DIR,
    stdio: 'pipe',
    env: {
      ...env,
      NODE_ENV: 'test',
      ARGON2_MEMORY_KIB: '1024',
      ADMIN_EMAIL: E2E_ADMIN.email,
      ADMIN_NAME: E2E_ADMIN.name,
      ADMIN_PASSWORD: E2E_ADMIN.password,
      SEED_TEST_CUSTOMER_EMAIL: E2E_CUSTOMER.email,
      SEED_TEST_CUSTOMER_NAME: E2E_CUSTOMER.name,
      SEED_TEST_CUSTOMER_PASSWORD: E2E_CUSTOMER.password,
    },
  });
}
