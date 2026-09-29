import type {
  AdminCategory,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminProduct,
  AdminSummary,
  CartQuote,
  CategoryInput,
  CategoryNode,
  CreateOrderInput,
  LoginInput,
  OrderDetail,
  OrderStatus,
  OrderStatusUpdate,
  Paginated,
  ProductFacets,
  ProductInput,
  ProductListParams,
  ProductPage,
  PublicUser,
  RegisterInput,
  SessionResponse,
} from '@mingo/shared';
import { apiFetch } from './api-client';

export type CartItemRef = { productId: string; quantity: number };

export const api = {
  session: () => apiFetch<SessionResponse>('/auth/me'),
  login: (input: LoginInput) =>
    apiFetch<{ user: PublicUser }>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    apiFetch<{ user: PublicUser }>('/auth/register', { method: 'POST', body: input }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  categories: () => apiFetch<CategoryNode[]>('/categories'),
  products: (params: ProductListParams) => apiFetch<ProductPage>('/products', { query: params }),
  facets: () => apiFetch<ProductFacets>('/products/facets'),

  cartQuote: (items: CartItemRef[]) =>
    apiFetch<CartQuote>('/cart/quote', { method: 'POST', body: { items } }),
  createOrder: (input: CreateOrderInput, idempotencyKey: string) =>
    apiFetch<{ order: OrderDetail }>('/orders', {
      method: 'POST',
      body: input,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  myOrders: (page: number, limit: number) =>
    apiFetch<Paginated<OrderDetail>>('/orders', { query: { page, limit } }),

  admin: {
    summary: () => apiFetch<AdminSummary>('/admin/summary'),
    products: (query: { search?: string; status?: string; page?: number }) =>
      apiFetch<Paginated<AdminProduct>>('/admin/products', { query }),
    product: (id: string) => apiFetch<AdminProduct>(`/admin/products/${id}`),
    createProduct: (input: ProductInput) =>
      apiFetch<AdminProduct>('/admin/products', { method: 'POST', body: input }),
    updateProduct: (id: string, input: ProductInput) =>
      apiFetch<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body: input }),
    setProductActive: (id: string, isActive: boolean) =>
      apiFetch<AdminProduct>(`/admin/products/${id}/active`, {
        method: 'PATCH',
        body: { isActive },
      }),
    archiveProduct: (id: string) => apiFetch<void>(`/admin/products/${id}`, { method: 'DELETE' }),
    restoreProduct: (id: string) =>
      apiFetch<AdminProduct>(`/admin/products/${id}/restore`, { method: 'POST' }),
    categories: () => apiFetch<AdminCategory[]>('/admin/categories'),
    createCategory: (input: CategoryInput) =>
      apiFetch<AdminCategory>('/admin/categories', { method: 'POST', body: input }),
    updateCategory: (id: string, input: CategoryInput) =>
      apiFetch<AdminCategory>(`/admin/categories/${id}`, { method: 'PUT', body: input }),
    deleteCategory: (id: string) => apiFetch<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
    orders: (query: { status?: OrderStatus; search?: string; page?: number }) =>
      apiFetch<Paginated<AdminOrderSummary>>('/admin/orders', { query }),
    order: (orderNumber: string) => apiFetch<AdminOrderDetail>(`/admin/orders/${orderNumber}`),
    changeOrderStatus: (orderNumber: string, input: OrderStatusUpdate) =>
      apiFetch<OrderDetail>(`/admin/orders/${orderNumber}/status`, {
        method: 'PATCH',
        body: input,
      }),
  },
};
