import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { App } from '../src/app';
import { buildTestApp } from './helpers/app';
import { createCategory, createProduct, createUser, sessionCookie } from './helpers/factories';
import { prisma } from './helpers/db';

let app: App;
let adminCookie: string;
beforeEach(async () => {
  app = await buildTestApp();
  adminCookie = sessionCookie(app, await createUser({ role: 'ADMIN' }));
});
afterEach(async () => {
  await app.close();
});

const id = randomUUID();
const ADMIN_ROUTES: Array<[method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string]> = [
  ['GET', '/api/admin/products'],
  ['GET', `/api/admin/products/${id}`],
  ['POST', '/api/admin/products'],
  ['PUT', `/api/admin/products/${id}`],
  ['PATCH', `/api/admin/products/${id}/active`],
  ['DELETE', `/api/admin/products/${id}`],
  ['POST', `/api/admin/products/${id}/restore`],
  ['GET', '/api/admin/categories'],
  ['POST', '/api/admin/categories'],
  ['PUT', `/api/admin/categories/${id}`],
  ['DELETE', `/api/admin/categories/${id}`],
  ['GET', '/api/admin/orders'],
  ['GET', '/api/admin/orders/MC-1'],
  ['PATCH', '/api/admin/orders/MC-1/status'],
  ['GET', '/api/admin/summary'],
];

describe('controle de acesso', () => {
  test.each(ADMIN_ROUTES)('%s %s: anônimo 401, usuário comum 403', async (method, url) => {
    const anonymous = await app.inject({
      method,
      url,
      payload: method === 'GET' || method === 'DELETE' ? undefined : {},
    });
    expect(anonymous.statusCode).toBe(401);

    const userCookie = sessionCookie(app, await createUser());
    const regular = await app.inject({
      method,
      url,
      headers: { cookie: userCookie },
      payload: method === 'GET' || method === 'DELETE' ? undefined : {},
    });
    expect(regular.statusCode).toBe(403);
  });
});

describe('produtos', () => {
  const productPayload = (categoryId: string, overrides: Record<string, unknown> = {}) => ({
    name: 'Produto Admin',
    description: 'Descrição',
    categoryId,
    priceCents: 5000,
    salePriceCents: 4000,
    stock: 7,
    tags: ['NEW'],
    images: [
      { url: '/placeholders/cogumelo.svg' },
      { url: 'https://cdn.example.com/b.jpg', alt: 'B' },
    ],
    ...overrides,
  });

  test('cria, edita, arquiva e restaura; a loja reflete cada mudança', async () => {
    const category = await createCategory();
    const created = await app.inject({
      method: 'POST',
      url: '/api/admin/products',
      headers: { cookie: adminCookie },
      payload: productPayload(category.id),
    });
    expect(created.statusCode).toBe(201);
    const product = created.json();
    expect(product).toMatchObject({
      slug: 'produto-admin',
      priceCents: 5000,
      salePriceCents: 4000,
      isActive: true,
    });
    expect(product.images).toHaveLength(2);

    const store = async () =>
      (await app.inject({ method: 'GET', url: '/api/products' }))
        .json()
        .items.map((p: { name: string }) => p.name);
    expect(await store()).toEqual(['Produto Admin']);

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/admin/products/${product.id}`,
      headers: { cookie: adminCookie },
      payload: productPayload(category.id, {
        name: 'Renomeado',
        slug: 'produto-admin',
        salePriceCents: null,
        images: [],
      }),
    });
    expect(updated.json()).toMatchObject({ name: 'Renomeado', salePriceCents: null, images: [] });
    const stored = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(stored.effectivePriceCents).toBe(5000);
    expect(stored.searchText).toContain('renomeado');

    await app.inject({
      method: 'DELETE',
      url: `/api/admin/products/${product.id}`,
      headers: { cookie: adminCookie },
    });
    expect(await store()).toEqual([]);

    await app.inject({
      method: 'POST',
      url: `/api/admin/products/${product.id}/restore`,
      headers: { cookie: adminCookie },
    });
    await app.inject({
      method: 'PATCH',
      url: `/api/admin/products/${product.id}/active`,
      headers: { cookie: adminCookie },
      payload: { isActive: true },
    });
    expect(await store()).toEqual(['Renomeado']);
  });

  test('slug duplicado responde 409 e promoção maior que o preço 400', async () => {
    const category = await createCategory();
    await createProduct({ slug: 'repetido', categoryId: category.id });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/admin/products',
      headers: { cookie: adminCookie },
      payload: productPayload(category.id, { slug: 'repetido' }),
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe('SLUG_TAKEN');

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/admin/products',
      headers: { cookie: adminCookie },
      payload: productPayload(category.id, { salePriceCents: 6000 }),
    });
    expect(invalid.statusCode).toBe(400);
  });
});

describe('categorias', () => {
  test('não exclui categoria com produtos ou subcategorias e limita a 2 níveis', async () => {
    const mae = await createCategory();
    const filha = await createCategory({ parentId: mae.id });
    await createProduct({ categoryId: filha.id });

    const blocked = await app.inject({
      method: 'DELETE',
      url: `/api/admin/categories/${mae.id}`,
      headers: { cookie: adminCookie },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error.code).toBe('CATEGORY_NOT_EMPTY');

    const neta = await app.inject({
      method: 'POST',
      url: '/api/admin/categories',
      headers: { cookie: adminCookie },
      payload: { name: 'Neta', parentId: filha.id },
    });
    expect(neta.statusCode).toBe(400);

    const empty = await createCategory();
    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/admin/categories/${empty.id}`,
      headers: { cookie: adminCookie },
    });
    expect(removed.statusCode).toBe(204);
  });
});

describe('pedidos', () => {
  async function createOrder(stock = 5) {
    const user = await createUser();
    const product = await createProduct({ stock, priceCents: 1000 });
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: sessionCookie(app, user), 'idempotency-key': randomUUID() },
      payload: {
        items: [{ productId: product.id, quantity: 2 }],
        customer: { name: 'Ana', email: 'ana@teste.local', phone: '11999999999' },
        shippingAddress: {
          street: 'Rua',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          zipCode: '01310100',
        },
        paymentMethod: 'CREDIT_CARD',
        expectedTotalCents: 2000,
      },
    });
    return { order: response.json().order, product };
  }

  const changeStatus = (orderNumber: string, payload: Record<string, unknown>) =>
    app.inject({
      method: 'PATCH',
      url: `/api/admin/orders/${orderNumber}/status`,
      headers: { cookie: adminCookie },
      payload,
    });

  test('transições válidas, rastreio obrigatório e transições inválidas', async () => {
    const { order } = await createOrder();
    expect(order.status).toBe('CONFIRMED');

    expect((await changeStatus(order.orderNumber, { status: 'SHIPPED' })).json().error.code).toBe(
      'TRACKING_REQUIRED',
    );

    const shipped = await changeStatus(order.orderNumber, {
      status: 'SHIPPED',
      trackingNumber: 'BR123456789BR',
    });
    expect(shipped.json()).toMatchObject({ status: 'SHIPPED', trackingNumber: 'BR123456789BR' });

    const invalid = await changeStatus(order.orderNumber, { status: 'CANCELLED' });
    expect(invalid.statusCode).toBe(409);
    expect(invalid.json().error.code).toBe('INVALID_STATUS_TRANSITION');

    const delivered = await changeStatus(order.orderNumber, { status: 'DELIVERED' });
    const events = delivered.json().events;
    expect(events.map((event: { toStatus: string }) => event.toStatus)).toEqual([
      'PENDING',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
    ]);
    expect(events.at(-1).actorName).toBe('Admin Teste');
  });

  test('cancelar devolve o estoque e estorna o pagamento aprovado', async () => {
    const { order, product } = await createOrder(5);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3);

    const cancelled = await changeStatus(order.orderNumber, {
      status: 'CANCELLED',
      note: 'Cliente desistiu',
    });
    expect(cancelled.json().status).toBe('CANCELLED');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(5);
    expect((await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } })).status).toBe(
      'REFUNDED',
    );
  });

  test('lista, busca e detalhe com dados do cliente', async () => {
    const { order } = await createOrder();
    const list = (
      await app.inject({
        method: 'GET',
        url: '/api/admin/orders?search=ana@teste',
        headers: { cookie: adminCookie },
      })
    ).json();
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({
      orderNumber: order.orderNumber,
      itemCount: 1,
      paymentMethod: 'CREDIT_CARD',
    });

    const detail = (
      await app.inject({
        method: 'GET',
        url: `/api/admin/orders/${order.orderNumber}`,
        headers: { cookie: adminCookie },
      })
    ).json();
    expect(detail.user).toHaveProperty('email');

    const summary = (
      await app.inject({
        method: 'GET',
        url: '/api/admin/summary',
        headers: { cookie: adminCookie },
      })
    ).json();
    expect(summary.ordersByStatus.CONFIRMED).toBe(1);
  });
});
