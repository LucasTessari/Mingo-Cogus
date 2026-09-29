import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { App } from '../src/app';
import { buildTestApp } from './helpers/app';
import { DEFAULT_PASSWORD, createUser, sessionCookie } from './helpers/factories';
import { prisma } from './helpers/db';

let app: App;
beforeEach(async () => {
  app = await buildTestApp();
});
afterEach(async () => {
  await app.close();
});

const cookieFrom = (response: { headers: Record<string, unknown> }) => {
  const header = response.headers['set-cookie'];
  return (Array.isArray(header) ? header[0] : String(header)) as string;
};

describe('registro e login', () => {
  test('registro cria sessão com cookie httpOnly e não expõe o hash', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Ana', email: 'ANA@Teste.Local', password: 'segredo123' },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.user).toMatchObject({ name: 'Ana', email: 'ana@teste.local', role: 'USER' });
    expect(JSON.stringify(body)).not.toContain('passwordHash');

    const cookie = cookieFrom(response);
    expect(cookie).toMatch(/^mc_session=/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@teste.local' } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  });

  test('email duplicado responde 409', async () => {
    await createUser({ email: 'ana@teste.local' });
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Ana', email: 'ana@teste.local', password: 'segredo123' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('EMAIL_TAKEN');
  });

  test('senha curta é rejeitada', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Ana', email: 'ana@teste.local', password: '123' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  test('login com senha errada ou email inexistente: INVALID_CREDENTIALS (não UNAUTHENTICATED)', async () => {
    await createUser({ email: 'ana@teste.local' });
    for (const payload of [
      { email: 'ana@teste.local', password: 'errada' },
      { email: 'ninguem@teste.local', password: 'errada' },
    ]) {
      const response = await app.inject({ method: 'POST', url: '/api/auth/login', payload });
      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  test('login correto devolve o usuário e a sessão funciona em /me', async () => {
    await createUser({ email: 'ana@teste.local' });
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ana@teste.local', password: DEFAULT_PASSWORD },
    });
    expect(login.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieFrom(login).split(';')[0]! },
    });
    expect(me.json().user.email).toBe('ana@teste.local');
  });
});

describe('sessão', () => {
  test('/me sem sessão devolve user null (200)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: null });
  });

  test('/me com cookie adulterado devolve null e limpa o cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: 'mc_session=abc.def.ghi' },
    });
    expect(response.json()).toEqual({ user: null });
    expect(cookieFrom(response)).toMatch(/mc_session=;/);
  });

  test('incrementar tokenVersion invalida sessões antigas', async () => {
    const user = await createUser();
    const cookie = sessionCookie(app, user);
    await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
    const response = await app.inject({ method: 'GET', url: '/api/orders', headers: { cookie } });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHENTICATED');
  });

  test('logout limpa o cookie', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(response.statusCode).toBe(204);
    expect(cookieFrom(response)).toMatch(/mc_session=;/);
  });
});

describe('segurança', () => {
  test('escrita vinda de outra origem é recusada', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'https://site-malicioso.example' },
      payload: { email: 'a@b.com', password: 'x' },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN_ORIGIN');
  });

  test('corpo que não é JSON é recusado (proteção contra formulário CSRF)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'email=a@b.com&password=x',
    });
    expect(response.statusCode).toBe(415);
  });

  test('rate limit no login', async () => {
    const limited = await buildTestApp({ env: { RATE_LIMIT_ENABLED: 'true' } });
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const response = await limited.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { email: 'x@teste.local', password: 'errada' },
        });
        statuses.push(response.statusCode);
      }
      expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
      expect(statuses[10]).toBe(429);
    } finally {
      await limited.close();
    }
  });
});
