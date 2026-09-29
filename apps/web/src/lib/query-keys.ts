import type { ProductListParams } from '@mingo/shared';
import type { CartItemRef } from './api';

// Chaves do TanStack Query em um só lugar (usadas também nas invalidações)
export const qk = {
  session: ['session'] as const,
  categories: ['categories'] as const,
  products: {
    all: ['products'] as const,
    list: (params: ProductListParams) => ['products', 'list', params] as const,
    facets: ['products', 'facets'] as const,
  },
  cartQuote: (items: CartItemRef[]) => ['cart', 'quote', items] as const,
  orders: {
    all: ['orders'] as const,
    mine: (page: number) => ['orders', 'mine', page] as const,
  },
  admin: {
    all: ['admin'] as const,
    summary: ['admin', 'summary'] as const,
    products: (query: object) => ['admin', 'products', query] as const,
    product: (id: string) => ['admin', 'product', id] as const,
    categories: ['admin', 'categories'] as const,
    orders: (query: object) => ['admin', 'orders', query] as const,
    order: (orderNumber: string) => ['admin', 'order', orderNumber] as const,
  },
};
