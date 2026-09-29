import { afterEach, describe, expect, test, vi } from 'vitest';
import { productListQuery } from '@mingo/shared';
import { ApiError, apiFetch, toQueryString } from './api-client';
import { toCatalogSearch } from '../hooks/useCatalogParams';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api-client', () => {
  test('query string ignora vazios e falsos e junta listas', () => {
    expect(
      toQueryString({
        search: 'b+',
        inStock: true,
        featured: false,
        tags: ['NEW', 'EASY_GROW'],
        page: undefined,
        x: '',
      }),
    ).toBe('?search=b%2B&inStock=true&tags=NEW%2CEASY_GROW');
    expect(toQueryString({})).toBe('');
  });

  test('erro da API vira ApiError com código e mensagem', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: { code: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos' },
            }),
            {
              status: 401,
            },
          ),
      ),
    );
    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Email ou senha inválidos',
    });
  });

  test('falha de rede vira NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const error = await apiFetch('/products').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NETWORK_ERROR');
  });

  test('envia cookies e JSON', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/cart/quote', { method: 'POST', body: { items: [] } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/cart/quote');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});

describe('filtros do catálogo na URL', () => {
  test('ida e volta entre filtros e URL, sem valores padrão', () => {
    const params = productListQuery.parse({
      search: 'golden',
      tags: 'NEW,EASY_GROW',
      minPrice: '1000',
      page: '2',
    });
    const search = toCatalogSearch(params);
    expect(search.toString()).toBe('search=golden&minPrice=1000&tags=NEW%2CEASY_GROW&page=2');
    expect(productListQuery.parse(Object.fromEntries(search))).toEqual(params);
  });
});
