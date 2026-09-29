import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PublicUser, Role } from '@mingo/shared';
import type { Env } from '../env';
import { AppError } from '../lib/app-error';
import { createPasswordHasher, type PasswordHasher } from '../lib/password';

export const SESSION_COOKIE = 'mc_session';

interface SessionToken {
  sub: string; // id do usuário
  tv: number; // tokenVersion: sessões antigas deixam de valer quando incrementado
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: SessionToken;
    user: SessionToken;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: { userId: string; role: Role };
  }
  interface FastifyInstance {
    passwords: PasswordHasher;
    authenticate: (request: FastifyRequest) => Promise<void>;
    requireAdmin: (request: FastifyRequest) => Promise<void>;
    getSessionUser: (request: FastifyRequest) => Promise<PublicUser | null>;
    startSession: (
      reply: FastifyReply,
      user: { id: string; tokenVersion: number },
    ) => Promise<void>;
    endSession: (reply: FastifyReply) => void;
  }
}

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

const toSeconds = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error(`Duração inválida: ${duration}`);
  return Number(match[1]) * DURATION_UNITS[match[2]!]!;
};

const unauthenticated = () => new AppError(401, 'UNAUTHENTICATED', 'Faça login para continuar');

export const authPlugin = fp<{ env: Env }>(async (app, { env }) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: toSeconds(env.JWT_EXPIRES_IN),
  };

  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: SESSION_COOKIE, signed: false },
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.decorate('passwords', createPasswordHasher(env.ARGON2_MEMORY_KIB));

  // Usuário da sessão atual, ou null se não houver sessão válida.
  // O papel vem sempre do banco, então rebaixar um admin vale na hora.
  const loadSessionUser = async (request: FastifyRequest) => {
    let token: SessionToken;
    try {
      token = await request.jwtVerify<SessionToken>();
    } catch {
      return null;
    }
    const user = await app.prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, name: true, email: true, role: true, tokenVersion: true },
    });
    return user && user.tokenVersion === token.tv ? user : null;
  };

  app.decorate('getSessionUser', async (request: FastifyRequest) => {
    const user = await loadSessionUser(request);
    return user && { id: user.id, name: user.name, email: user.email, role: user.role };
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    const user = await loadSessionUser(request);
    if (!user) throw unauthenticated();
    request.auth = { userId: user.id, role: user.role };
  });

  app.decorate('requireAdmin', async (request: FastifyRequest) => {
    await app.authenticate(request);
    if (request.auth?.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Acesso restrito a administradores');
    }
  });

  app.decorate(
    'startSession',
    async (reply: FastifyReply, user: { id: string; tokenVersion: number }) => {
      const token = await reply.jwtSign({ sub: user.id, tv: user.tokenVersion });
      reply.setCookie(SESSION_COOKIE, token, cookieOptions);
    },
  );

  app.decorate('endSession', (reply: FastifyReply) => {
    reply.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  });
});
