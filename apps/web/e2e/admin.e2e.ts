// Painel admin: produtos na loja e ciclo de vida de um pedido
import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import type { Paginated, ProductSummary } from '@mingo/shared';
import { E2E_ADMIN, E2E_CUSTOMER } from './e2e-env';

const login = (request: APIRequestContext, user: { email: string; password: string }) =>
  request.post('/api/auth/login', { data: { email: user.email, password: user.password } });

// Pedido criado pela API como o cliente de teste
async function createOrder(request: APIRequestContext) {
  await login(request, E2E_CUSTOMER);
  const catalog = (await (
    await request.get('/api/products?search=amazonian')
  ).json()) as Paginated<ProductSummary>;
  const product = catalog.items[0]!;
  const response = await request.post('/api/orders', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: {
      items: [{ productId: product.id, quantity: 1 }],
      customer: { name: E2E_CUSTOMER.name, email: E2E_CUSTOMER.email, phone: '11999990000' },
      shippingAddress: {
        street: 'Rua A',
        number: '1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310100',
      },
      paymentMethod: 'CREDIT_CARD',
      expectedTotalCents: product.effectivePriceCents,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).order.orderNumber as string;
}

test('admin marca o pedido como enviado e o cliente vê o rastreio', async ({ browser }) => {
  const customer = await browser.newContext();
  const orderNumber = await createOrder(customer.request);

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin.request, E2E_ADMIN);
  await admin.goto('/admin/orders');
  await admin.getByRole('link', { name: orderNumber }).click();
  await admin.selectOption('#next-status', 'SHIPPED');
  await admin.fill('#tracking', 'BR123456789BR');
  await admin.getByRole('button', { name: 'Salvar status' }).click();
  await expect(admin.locator('.admin-page-header .admin-pill')).toHaveText('Enviado');

  const page = await customer.newPage();
  await page.goto('/orders');
  const order = page.locator('.order-card', { hasText: orderNumber });
  await expect(order.locator('.status-badge')).toHaveText('Enviado');
  await expect(order).toContainText('Código de rastreio: BR123456789BR');

  await customer.close();
  await adminContext.close();
});

test('produto criado no painel aparece na loja; cliente comum não entra no painel', async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin.request, E2E_ADMIN);
  await admin.goto('/admin/products/new');
  await admin.fill('#name', 'Espátula Inox E2E');
  await admin.fill('#description', 'Espátula de aço inox para manipulação estéril.');
  await admin.selectOption('#categoryId', { label: 'Acessórios › Espátulas' });
  await admin.fill('#priceCents', '24,90');
  await admin.fill('#stock', '7');
  await admin.getByRole('button', { name: 'Salvar produto' }).click();
  await expect(admin).toHaveURL(/\/admin\/products$/);
  await expect(admin.getByRole('link', { name: 'Espátula Inox E2E' })).toBeVisible();

  const shopper = await browser.newContext();
  const page = await shopper.newPage();
  await page.goto('/products?search=espatula');
  const card = page.locator('.product-card', { hasText: 'Espátula Inox E2E' });
  await expect(card.locator('.product-price')).toHaveText('R$ 24.90');

  await login(page.request, E2E_CUSTOMER);
  await page.goto('/admin');
  await expect(page).toHaveURL(/localhost:\d+\/$/);

  await shopper.close();
  await adminContext.close();
});
