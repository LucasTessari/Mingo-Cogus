import { buildApp, type App } from '../../src/app';
import { loadEnv } from '../../src/env';
import type { PaymentProvider } from '../../src/modules/payments/provider';
import { prisma } from './db';

interface TestAppOptions {
  payments?: PaymentProvider;
  env?: Record<string, string>;
  // Rotas extras registradas só para o teste (antes do app ficar pronto)
  extend?: (app: App) => void;
}

export async function buildTestApp(options: TestAppOptions = {}) {
  const env = loadEnv({ ...process.env, ...options.env });
  const app = await buildApp({ env, prisma, payments: options.payments });
  options.extend?.(app);
  await app.ready();
  return app;
}
