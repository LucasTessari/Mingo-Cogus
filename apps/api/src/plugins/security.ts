import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { Env } from '../env';
import { AppError } from '../lib/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Limites por rota (usados em `config.rateLimit`); só valem com RATE_LIMIT_ENABLED=true
export const RATE_LIMITS = {
  login: { max: 10, timeWindow: '15 minutes' },
  register: { max: 5, timeWindow: '1 hour' },
  orders: { max: 20, timeWindow: '1 minute' },
  cartQuote: { max: 60, timeWindow: '1 minute' },
} as const;

export const securityPlugin = fp<{ env: Env }>(async (app, { env }) => {
  await app.register(helmet);

  // CORS só é necessário quando site e API estão em domínios diferentes
  if (env.CORS_ORIGINS.length > 0) {
    await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true });
  }

  if (env.RATE_LIMIT_ENABLED) {
    await app.register(rateLimit, {
      global: false,
      errorResponseBuilder: () =>
        new AppError(429, 'RATE_LIMITED', 'Muitas tentativas. Aguarde um pouco e tente novamente.'),
    });
  }

  // Proteção contra CSRF: além do cookie SameSite=Lax e de só aceitar JSON,
  // requisições de escrita vindas de outra origem são recusadas.
  const allowedOrigins = new Set([env.WEB_ORIGIN, ...env.CORS_ORIGINS]);
  app.addHook('onRequest', async (request) => {
    if (SAFE_METHODS.has(request.method)) return;
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      throw new AppError(403, 'FORBIDDEN_ORIGIN', 'Origem não permitida');
    }
  });
});
