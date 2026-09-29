import type { ErrorBody, ErrorCode } from '@mingo/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

type QueryValue = string | number | boolean | readonly string[] | null | undefined;

// Monta a query string ignorando valores vazios/falsos e juntando listas com vírgula
export function toQueryString(query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
}

// Chamada à API (mesma origem via proxy): envia o cookie de sessão e converte erros em ApiError
export async function apiFetch<T>(
  path: string,
  { method = 'GET', query, body, headers }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}${toQueryString(query)}`, {
      method,
      credentials: 'include',
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Falha de conexão. Verifique sua internet e tente novamente.',
    );
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? 'Erro inesperado. Tente novamente.',
      error?.details,
    );
  }
  return data as T;
}
