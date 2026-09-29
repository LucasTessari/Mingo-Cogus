import { describe, expect, test } from 'vitest';
import * as shared from '@mingo/shared';
import * as prismaEnums from '../src/generated/prisma/enums';
import { loadEnv } from '../src/env';
import { buildTestApp } from './helpers/app';

describe('erros', () => {
  test('rota inexistente responde 404 no formato padrão', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/nao-existe' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada' },
    });
    await app.close();
  });

  test('erro inesperado vira 500 genérico, sem vazar a mensagem interna', async () => {
    const app = await buildTestApp({
      extend: (instance) =>
        instance.get('/api/explode', async () => {
          throw new Error('detalhe interno secreto');
        }),
    });
    const response = await app.inject({ method: 'GET', url: '/api/explode' });
    expect(response.statusCode).toBe(500);
    expect(response.json().error.code).toBe('INTERNAL_ERROR');
    expect(response.body).not.toContain('secreto');
    await app.close();
  });
});

describe('ambiente', () => {
  const base = { DATABASE_URL: 'postgresql://x:y@localhost:5432/db', JWT_SECRET: 'a'.repeat(40) };

  test('JWT_SECRET ausente ou curto impede a inicialização', () => {
    expect(() => loadEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ ...base, JWT_SECRET: 'curto' })).toThrow(/32 caracteres/);
  });

  test('em produção, segredos de exemplo são recusados e o cookie é seguro', () => {
    expect(() =>
      loadEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: `change-me-${'x'.repeat(40)}` }),
    ).toThrow(/exemplo/);
    expect(loadEnv({ ...base, NODE_ENV: 'production' }).COOKIE_SECURE).toBe(true);
    expect(loadEnv(base).COOKIE_SECURE).toBe(false);
  });
});

test('enums do Prisma e do pacote shared são idênticos', () => {
  const pairs: Array<[readonly string[], Record<string, string>]> = [
    [shared.ROLES, prismaEnums.Role],
    [shared.POTENCIES, prismaEnums.Potency],
    [shared.CULTIVATION_METHODS, prismaEnums.CultivationMethod],
    [shared.PRODUCT_TAGS, prismaEnums.ProductTag],
    [shared.ORDER_STATUSES, prismaEnums.OrderStatus],
    [shared.PAYMENT_METHODS, prismaEnums.PaymentMethod],
    [shared.PAYMENT_STATUSES, prismaEnums.PaymentStatus],
  ];
  for (const [sharedValues, prismaEnum] of pairs) {
    expect([...sharedValues].sort()).toEqual(Object.values(prismaEnum).sort());
  }
});
