import fp from 'fastify-plugin';
import type { Env } from '../env';
import { createPrismaClient, type PrismaClient } from '../lib/db';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Usa o cliente recebido (testes) ou cria um a partir de DATABASE_URL
export const prismaPlugin = fp<{ env: Env; prisma?: PrismaClient }>(async (app, opts) => {
  const prisma = opts.prisma ?? createPrismaClient(opts.env.DATABASE_URL);
  app.decorate('prisma', prisma);
  if (!opts.prisma) {
    app.addHook('onClose', async () => {
      await prisma.$disconnect();
    });
  }
});
