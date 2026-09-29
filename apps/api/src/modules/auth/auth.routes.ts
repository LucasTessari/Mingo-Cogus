import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { loginInput, publicUser, registerInput, sessionResponse } from '@mingo/shared';
import { AppError } from '../../lib/app-error';
import { RATE_LIMITS } from '../../plugins/security';
import { SESSION_COOKIE } from '../../plugins/auth';

const userResponse = z.object({ user: publicUser });
const userFields = { id: true, name: true, email: true, role: true, tokenVersion: true } as const;

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // Hash usado quando o email não existe, para o tempo de resposta não revelar quais emails têm conta
  const dummyHash = app.passwords.hash('senha-inexistente-para-tempo-constante');

  app.post(
    '/auth/register',
    {
      schema: { body: registerInput, response: { 201: userResponse } },
      config: { rateLimit: RATE_LIMITS.register },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;
      if (await app.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new AppError(409, 'EMAIL_TAKEN', 'Usuário já existe com este email');
      }
      const user = await app.prisma.user.create({
        data: { name, email, passwordHash: await app.passwords.hash(password) },
        select: userFields,
      });
      await app.startSession(reply, user);
      return reply.status(201).send({ user });
    },
  );

  app.post(
    '/auth/login',
    {
      schema: { body: loginInput, response: { 200: userResponse } },
      config: { rateLimit: RATE_LIMITS.login },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const user = await app.prisma.user.findUnique({
        where: { email },
        select: { ...userFields, passwordHash: true },
      });
      const valid = await app.passwords.verify(user?.passwordHash ?? (await dummyHash), password);
      if (!user || !valid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');
      }
      await app.startSession(reply, user);
      return { user };
    },
  );

  app.post('/auth/logout', async (_request, reply) => {
    app.endSession(reply);
    return reply.status(204).send();
  });

  // Sempre 200: sem sessão válida devolve { user: null } (e limpa um cookie inválido).
  // Assim, 401 nas demais rotas significa sempre "sessão expirada".
  app.get(
    '/auth/me',
    { schema: { response: { 200: sessionResponse } } },
    async (request, reply) => {
      const user = await app.getSessionUser(request);
      if (!user && request.cookies[SESSION_COOKIE]) app.endSession(reply);
      return { user };
    },
  );
};
