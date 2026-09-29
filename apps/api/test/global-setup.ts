import { execSync } from 'node:child_process';
import pg from 'pg';
import { TEST_DATABASE_URL } from '../vitest.config';

// Cria o banco de testes (se preciso) e aplica as migrações antes da suíte
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const database = url.pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(`O banco de testes precisa terminar em "_test" (recebido: ${database})`);
  }

  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  maintenance.search = '';
  const client = new pg.Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      database,
    ]);
    if (!rowCount) await client.query(`CREATE DATABASE "${database}"`);
  } finally {
    await client.end();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
