import type { ErrorCode } from '@mingo/shared';

// Erro esperado da aplicação: vira { error: { code, message, details } } com o status informado
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (message = 'Não encontrado') => new AppError(404, 'NOT_FOUND', message);
