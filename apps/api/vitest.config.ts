import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

if (existsSync('.env')) process.loadEnvFile('.env');

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://mingo:mingo@127.0.0.1:5433/mingo_test?schema=public';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    // Um único banco de testes: os arquivos rodam um de cada vez
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres-0123456789',
      RATE_LIMIT_ENABLED: 'false',
      LOG_LEVEL: 'silent',
      ARGON2_MEMORY_KIB: '1024',
      PAYMENT_SIMULATOR_OUTCOME: 'approve',
      WEB_ORIGIN: 'http://localhost:5173',
      CORS_ORIGINS: '',
    },
  },
});
