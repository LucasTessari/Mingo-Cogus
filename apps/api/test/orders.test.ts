import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { App } from '../src/app';
import type { PaymentProvider } from '../src/modules/payments/provider';
import { buildTestApp } from './helpers/app';
import { createProduct, createUser, sessionCookie } from './helpers/factories';
import { prisma } from './helpers/db';

let app: App;
beforeEach(async () => {
  app = await buildTestApp();
});
afterEach(async () => {
  await app.close();
});

const customer = { name: 'Ana Silva', email: 'ana@teste.local', phone: '11999999999' };
const shippingAddress = {
  street: 'Rua das Flores',
  number: '10',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
};

async function placeOrder(
  target: App,
  cookie: string,
  items: Array<{ productId: string; quantity: number }>,
  expectedTotalCents: number,
  extra: { key?: string; body?: Record<string, unknown> } = {},
) {
  return target.inject({
    method: 'POST',
    url: '/api/orders',
    headers: { cookie, 'idempotency-key': extra.key ?? randomUUID() },
    payload: {
      items,
      customer,
      shippingAddress,
      paymentMethod: 'PIX',
      expectedTotalCents,
      ...extra.body,
    },
  });
}

describe('cotação do carrinho', () => {
  test('usa preços do banco e aponta problemas por linha', async () => {
    const promo = await createProduct({ priceCents: 8990, salePriceCents: 7990, stock: 5 });
    const pouco = await createProduct({ priceCents: 1000, stock: 1 });
    const inativo = await createProduct({ isActive: false });

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart/quote',
      payload: {
        items: [
          { productId: promo.id, quantity: 2 },
          { productId: pouco.id, quantity: 3 },
          { productId: inativo.id, quantity: 1 },
          { productId: randomUUID(), quantity: 1 },
        ],
      },
    });
    const quote = response.json();
    expect(quote.lines.map((line: { issues: string[] }) => line.issues)).toEqual([
      [],
      ['INSUFFICIENT_STOCK'],
      ['UNAVAILABLE'],
      ['UNAVAILABLE'],
    ]);
    expect(quote.lines[0]).toMatchObject({ unitPriceCents: 7990, lineTotalCents: 15980 });
    expect(quote.subtotalCents).toBe(15980 + 3000);
    expect(quote.hasIssues).toBe(true);
  });
});

describe('criação de pedido', () => {
  test('exige login', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/orders', payload: {} });
    expect(response.statusCode).toBe(401);
  });

  test('exige Idempotency-Key', async () => {
    const user = await createUser();
    const product = await createProduct();
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: sessionCookie(app, user) },
      payload: {
        items: [{ productId: product.id, quantity: 1 }],
        customer,
        shippingAddress,
        paymentMethod: 'PIX',
        expectedTotalCents: 1000,
      },
    });
    expect(response.json().error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  test('rejeita campos de preço enviados pelo cliente', async () => {
    const user = await createUser();
    const product = await createProduct();
    const response = await placeOrder(
      app,
      sessionCookie(app, user),
      [{ productId: product.id, quantity: 1 }],
      1000,
      {
        body: { totalCents: 1 },
      },
    );
    expect(response.statusCode).toBe(400);
  });

  test('calcula tudo no servidor, baixa o estoque e confirma com pagamento aprovado', async () => {
    const user = await createUser();
    const product = await createProduct({ priceCents: 8990, salePriceCents: 7990, stock: 5 });
    const response = await placeOrder(
      app,
      sessionCookie(app, user),
      [{ productId: product.id, quantity: 2 }],
      15980,
    );

    expect(response.statusCode).toBe(201);
    const { order } = response.json();
    expect(order).toMatchObject({
      status: 'CONFIRMED',
      subtotalCents: 15980,
      totalCents: 15980,
      payment: { method: 'PIX', status: 'APPROVED' },
      shippingAddress: { zipCode: '01310100', country: 'BR' },
    });
    expect(order.orderNumber).toMatch(/^MC-\d{8}-000001$/);
    expect(order.items[0]).toMatchObject({
      unitPriceCents: 7990,
      quantity: 2,
      lineTotalCents: 15980,
    });
    expect(order.events.map((event: { toStatus: string }) => event.toStatus)).toEqual([
      'PENDING',
      'CONFIRMED',
    ]);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3);
  });

  test('total esperado diferente do atual: PRICE_CHANGED com a cotação nova', async () => {
    const user = await createUser();
    const product = await createProduct({ priceCents: 5000 });
    const response = await placeOrder(
      app,
      sessionCookie(app, user),
      [{ productId: product.id, quantity: 1 }],
      4000,
    );
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('PRICE_CHANGED');
    expect(response.json().error.details.quote.totalCents).toBe(5000);
  });

  test('falta de estoque em um item não baixa o estoque dos outros', async () => {
    const user = await createUser();
    const ok = await createProduct({ stock: 10, priceCents: 1000 });
    const pouco = await createProduct({ stock: 1, priceCents: 1000 });
    const response = await placeOrder(
      app,
      sessionCookie(app, user),
      [
        { productId: ok.id, quantity: 2 },
        { productId: pouco.id, quantity: 2 },
      ],
      4000,
    );
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('INSUFFICIENT_STOCK');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ok.id } })).stock).toBe(10);
    expect(await prisma.order.count()).toBe(0);
  });

  test('corrida pelo último item: exatamente um pedido é criado', async () => {
    const [ana, bia] = await Promise.all([createUser(), createUser()]);
    const product = await createProduct({ stock: 1, priceCents: 1000 });
    const items = [{ productId: product.id, quantity: 1 }];
    const responses = await Promise.all([
      placeOrder(app, sessionCookie(app, ana), items, 1000),
      placeOrder(app, sessionCookie(app, bia), items, 1000),
    ]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(0);
  });

  test('pedidos simultâneos recebem números únicos e sequenciais', async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 100, priceCents: 1000 });
    const cookie = sessionCookie(app, user);
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        placeOrder(app, cookie, [{ productId: product.id, quantity: 1 }], 1000),
      ),
    );
    const numbers = responses.map((response) => response.json().order.orderNumber as string);
    expect(new Set(numbers).size).toBe(20);
    expect(numbers.map((n) => Number(n.slice(-6))).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  test('repetir a mesma Idempotency-Key devolve o mesmo pedido', async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 5, priceCents: 1000 });
    const cookie = sessionCookie(app, user);
    const key = randomUUID();
    const items = [{ productId: product.id, quantity: 1 }];
    const first = await placeOrder(app, cookie, items, 1000, { key });
    const second = await placeOrder(app, cookie, items, 1000, { key });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json().order.id).toBe(first.json().order.id);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(4);
  });

  test('pagamento recusado cancela o pedido e devolve o estoque', async () => {
    const declining: PaymentProvider = {
      name: 'teste',
      charge: async () => ({ status: 'DECLINED', reason: 'Cartão recusado' }),
      refund: async () => ({ ok: true }),
    };
    const declineApp = await buildTestApp({ payments: declining });
    try {
      const user = await createUser();
      const product = await createProduct({ stock: 3, priceCents: 1000 });
      const response = await placeOrder(
        declineApp,
        sessionCookie(declineApp, user),
        [{ productId: product.id, quantity: 2 }],
        2000,
      );
      expect(response.statusCode).toBe(201);
      expect(response.json().order).toMatchObject({
        status: 'CANCELLED',
        payment: { status: 'DECLINED' },
      });
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3);
    } finally {
      await declineApp.close();
    }
  });
});

describe('meus pedidos', () => {
  test('lista só os pedidos do usuário, do mais recente para o mais antigo', async () => {
    const [ana, bia] = await Promise.all([createUser(), createUser()]);
    const product = await createProduct({ stock: 10, priceCents: 1000 });
    const items = [{ productId: product.id, quantity: 1 }];
    const first = (await placeOrder(app, sessionCookie(app, ana), items, 1000)).json().order;
    const second = (await placeOrder(app, sessionCookie(app, ana), items, 1000)).json().order;
    await placeOrder(app, sessionCookie(app, bia), items, 1000);

    const page = (
      await app.inject({
        method: 'GET',
        url: '/api/orders',
        headers: { cookie: sessionCookie(app, ana) },
      })
    ).json();
    expect(page.total).toBe(2);
    expect(page.items.map((order: { id: string }) => order.id)).toEqual([second.id, first.id]);
  });

  test('pedido de outra pessoa responde 404', async () => {
    const [ana, bia] = await Promise.all([createUser(), createUser()]);
    const product = await createProduct();
    const order = (
      await placeOrder(app, sessionCookie(app, ana), [{ productId: product.id, quantity: 1 }], 1000)
    ).json().order;

    const own = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.orderNumber}`,
      headers: { cookie: sessionCookie(app, ana) },
    });
    const other = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.orderNumber}`,
      headers: { cookie: sessionCookie(app, bia) },
    });
    expect(own.statusCode).toBe(200);
    expect(other.statusCode).toBe(404);
  });

  test('o pedido guarda nome e preço da época da compra', async () => {
    const user = await createUser();
    const product = await createProduct({ name: 'Nome antigo', priceCents: 1000 });
    const order = (
      await placeOrder(
        app,
        sessionCookie(app, user),
        [{ productId: product.id, quantity: 1 }],
        1000,
      )
    ).json().order;
    await prisma.product.update({
      where: { id: product.id },
      data: { name: 'Nome novo', priceCents: 5000, effectivePriceCents: 5000 },
    });

    const detail = (
      await app.inject({
        method: 'GET',
        url: `/api/orders/${order.orderNumber}`,
        headers: { cookie: sessionCookie(app, user) },
      })
    ).json();
    expect(detail.order.items[0]).toMatchObject({
      productName: 'Nome antigo',
      unitPriceCents: 1000,
    });
  });
});
