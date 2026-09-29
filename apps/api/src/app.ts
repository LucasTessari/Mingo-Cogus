import Fastify from 'fastify';
import pino from 'pino';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Env } from './env';
import type { PrismaClient } from './lib/db';
import { authPlugin } from './plugins/auth';
import { errorsPlugin } from './plugins/errors';
import { paymentsPlugin } from './plugins/payments';
import { prismaPlugin } from './plugins/prisma';
import { securityPlugin } from './plugins/security';
import { adminRoutes } from './modules/admin/admin.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { cartRoutes } from './modules/cart/cart.routes';
import { catalogRoutes } from './modules/catalog/catalog.routes';
import { orderRoutes } from './modules/orders/orders.routes';
import type { PaymentProvider } from './modules/payments/provider';
import { SimulatedPaymentProvider } from './modules/payments/simulated';

export interface BuildAppOptions {
  env: Env;
  prisma?: PrismaClient;
  payments?: PaymentProvider;
}

// Nunca registrar cookies, senhas ou corpos de requisição (contêm dados pessoais).
// Em desenvolvimento, logs legíveis via pino-pretty na thread principal (o transporte em
// worker thread trava a inicialização quando a saída é um pipe, como em alguns terminais/IDEs).
const createLogger = async (env: Env) => {
  const options = {
    level: env.LOG_LEVEL,
    redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
  };
  if (env.NODE_ENV !== 'development') return pino(options);
  // pino-pretty é dependência de desenvolvimento: só é carregado aqui
  const { default: pretty } = await import('pino-pretty');
  return pino(options, pretty({ translateTime: 'HH:MM:ss', ignore: 'pid,hostname', sync: true }));
};

export async function buildApp({ env, prisma, payments }: BuildAppOptions) {
  const app = Fastify({
    loggerInstance: await createLogger(env),
    bodyLimit: 256 * 1024,
    trustProxy: env.TRUST_PROXY,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorsPlugin);
  await app.register(securityPlugin, { env });
  await app.register(prismaPlugin, { env, prisma });
  await app.register(authPlugin, { env });
  await app.register(paymentsPlugin, {
    provider: payments ?? new SimulatedPaymentProvider(env.PAYMENT_SIMULATOR_OUTCOME),
  });

  await app.register(
    async (api) => {
      api.get('/health', async () => {
        await app.prisma.$queryRaw`SELECT 1`;
        return { status: 'ok' };
      });
      await api.register(authRoutes);
      await api.register(catalogRoutes);
      await api.register(cartRoutes);
      await api.register(orderRoutes);
      await api.register(adminRoutes, { prefix: '/admin' });
    },
    { prefix: '/api' },
  );

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
