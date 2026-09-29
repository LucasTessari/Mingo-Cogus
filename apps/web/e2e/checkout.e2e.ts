// Fluxo completo de compra: navegar, montar o carrinho, criar conta pelo modal, pagar e ver o pedido
import { expect, test } from '@playwright/test';

test('cliente novo compra pelo site e vê o pedido em Meus Pedidos', async ({ page }) => {
  const email = `cliente+${Date.now()}@teste.local`;

  // Home com as vitrines e o carrinho vazio
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '⭐ Produtos em Destaque' })).toBeVisible();

  // Catálogo filtrado pela categoria do menu
  await page.locator('.category-link', { hasText: 'Esporos' }).click();
  await expect(page).toHaveURL(/category=esporos/);
  const card = page.locator('.product-card', { hasText: 'B+ - Seringa de Esporos' });
  await card.getByRole('button', { name: 'Adicionar ao Carrinho' }).click();
  await expect(card.locator('.cart-indicator')).toHaveText('1 no carrinho');
  await expect(page.locator('.cart-badge-header')).toHaveText('1');

  // Carrinho: 2 unidades, total calculado pelo servidor
  await page.locator('.cart-btn-header').click();
  await page.locator('.quantity-controls button', { hasText: '+' }).click();
  await expect(page.locator('.summary-row.total')).toContainText('R$ 159.80');

  // Finalizar sem login abre o cadastro e volta para o checkout
  await page.getByRole('button', { name: '🚀 Finalizar Compra' }).click();
  await page.getByRole('button', { name: 'Cadastre-se' }).click();
  await page.fill('#name', 'Cliente E2E');
  await page.fill('#email', email);
  await page.fill('#password', 'senha-e2e-123');
  await page.fill('#confirmPassword', 'senha-e2e-123');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Etapa 1 já vem com nome e email da conta
  await expect(page.locator('#name')).toHaveValue('Cliente E2E');
  await expect(page.locator('#email')).toHaveValue(email);
  await page.fill('#phone', '11988887777');
  await page.getByRole('button', { name: 'Continuar para Entrega' }).click();

  // Etapa 2: CEP inválido é recusado antes de seguir
  await page.fill('#street', 'Rua dos Cogumelos');
  await page.fill('#number', '42');
  await page.fill('#neighborhood', 'Jardim');
  await page.fill('#city', 'Campinas');
  await page.fill('#state', 'SP');
  await page.fill('#zipCode', '123');
  await page.getByRole('button', { name: 'Continuar para Pagamento' }).click();
  await expect(page.locator('.error-message')).toContainText('CEP');
  await page.fill('#zipCode', '13010-000');
  await page.getByRole('button', { name: 'Continuar para Pagamento' }).click();

  // Etapa 3: PIX e confirmação
  await page.locator('input[value=pix]').check();
  await expect(page.locator('.order-total')).toContainText('R$ 159.80');
  await page.getByRole('button', { name: 'Confirmar Pedido' }).click();
  await expect(page.getByRole('heading', { name: 'Pedido Confirmado!' })).toBeVisible();
  const orderNumber = (await page
    .getByText(/Número do pedido: MC-\d{8}-\d{6}/)
    .textContent())!.replace('Número do pedido: ', '');
  await expect(page.locator('.cart-badge-header')).toHaveCount(0);

  // Meus Pedidos mostra o pedido confirmado, com o preço da compra
  await page.locator('.user-link').click();
  await page.getByRole('button', { name: 'Meus Pedidos' }).click();
  const order = page.locator('.order-card', { hasText: orderNumber });
  await expect(order.locator('.status-badge')).toHaveText('Confirmado');
  await expect(order).toContainText('Total: R$ 159.80');
  await expect(order).toContainText('Pagamento: PIX');
});

test('senha errada mostra o erro no modal, sem recarregar a página', async ({ page }) => {
  await page.goto('/products');
  await page.locator('.login-link').click();
  await page.fill('#email', 'ninguem@teste.local');
  await page.fill('#password', 'senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('.auth-error')).toHaveText('Email ou senha inválidos');
  await expect(page).toHaveURL(/\/products$/);
});

test('checkout sem login volta ao carrinho com o login aberto', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('.auth-container')).toBeVisible();
});
