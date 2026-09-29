import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  DEFAULT_PAGE_SIZE,
  productListQuery,
  type ProductListParams,
  type ProductListQuery,
} from '@mingo/shared';

// Valores padrão não aparecem na URL
const DEFAULTS: Partial<Record<keyof ProductListQuery, unknown>> = {
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
};

export function toCatalogSearch(params: ProductListParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (DEFAULTS[key as keyof ProductListQuery] === value) continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  return search;
}

// Filtros do catálogo guardados na URL (sobrevivem a refresh e ao botão voltar)
export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => productListQuery.parse(Object.fromEntries(searchParams)),
    [searchParams],
  );

  // Mudança de filtro volta para a página 1; `replace` evita poluir o histórico (ex.: busca digitada)
  const setParams = (next: ProductListParams, { keepPage = false, replace = false } = {}) => {
    setSearchParams(toCatalogSearch({ ...next, page: keepPage ? next.page : undefined }), {
      replace,
    });
  };

  return { params, setParams };
}
