import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Variáveis já definidas no ambiente têm prioridade sobre o .env
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // '' permite rodar `prisma generate` sem banco configurado
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
