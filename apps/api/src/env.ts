import { existsSync } from 'node:fs';
import { z } from 'zod';

const bool = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? fallback : value === 'true'));

const csvUrls = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()));

const PLACEHOLDER_SECRET = /change|secret|example|placeholder/i;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().default(3333),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    WEB_ORIGIN: z.url().default('http://localhost:5173'),
    CORS_ORIGINS: csvUrls,
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    TRUST_PROXY: bool(false),
    RATE_LIMIT_ENABLED: bool(true),
    PAYMENT_SIMULATOR_OUTCOME: z.enum(['approve', 'decline', 'pending']).default('approve'),
    ARGON2_MEMORY_KIB: z.coerce.number().int().min(1024).default(19456),
  })
  .transform((env) => ({
    ...env,
    COOKIE_SECURE: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : env.NODE_ENV === 'production',
  }))
  .refine((env) => env.NODE_ENV !== 'production' || !PLACEHOLDER_SECRET.test(env.JWT_SECRET), {
    message: 'JWT_SECRET parece um valor de exemplo; gere um segredo aleatório para produção',
    path: ['JWT_SECRET'],
  });

export type Env = z.output<typeof envSchema>;

// Lê o .env (quando existe) e valida o ambiente. Variáveis já definidas têm prioridade.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (source === process.env && existsSync('.env')) process.loadEnvFile('.env');

  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Configuração de ambiente inválida:\n${issues.join('\n')}`);
  }
  return result.data;
}
