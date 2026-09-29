import fp from 'fastify-plugin';
import type { FastifyError } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import type { ErrorBody, ErrorCode } from '@mingo/shared';
import { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/app-error';

const body = (code: ErrorCode, message: string, details?: unknown): ErrorBody => ({
  error: { code, message, ...(details !== undefined && { details }) },
});

// Toda resposta de erro segue { error: { code, message, details? } }.
// Erros inesperados viram 500 genérico: a mensagem interna fica só no log.
export const errorsPlugin = fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(body(error.code, error.message, error.details));
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const details = error.validation.map((issue) => ({
        path: issue.instancePath.slice(1).replace(/\//g, '.'),
        message: issue.message,
      }));
      return reply.status(400).send(body('VALIDATION_ERROR', 'Dados inválidos', details));
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        return reply.status(409).send(body('CONFLICT', 'Registro duplicado'));
      if (error.code === 'P2025')
        return reply.status(404).send(body('NOT_FOUND', 'Não encontrado'));
    }

    if (error.code?.startsWith('FST_JWT')) {
      return reply.status(401).send(body('UNAUTHENTICATED', 'Faça login para continuar'));
    }

    if (error.statusCode === 415) {
      return reply.status(415).send(body('UNSUPPORTED_MEDIA_TYPE', 'Envie os dados como JSON'));
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send(body('VALIDATION_ERROR', 'Requisição inválida'));
    }

    request.log.error({ err: error }, 'erro não tratado');
    return reply.status(500).send(body('INTERNAL_ERROR', 'Erro interno. Tente novamente.'));
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send(body('NOT_FOUND', 'Rota não encontrada'));
  });
});
