// Cenários da comparação visual. Os MESMOS passos rodam no site original (ICO, para gerar as
// screenshots de referência) e no site novo (para comparar pixel a pixel).
import type { BrowserContext, Page } from '@playwright/test';

export type AppKind = 'ico' | 'new';

export interface ScenarioContext {
  app: AppKind;
  // Deixa o navegador logado como o cliente de teste (cada app do seu jeito)
  login: () => Promise<void>;
  // Coloca produtos no carrinho (formato de armazenamento de cada app)
  fillCart: (items: Array<{ slug: string; quantity: number }>) => Promise<void>;
}

export interface Scenario {
  name: string;
  fullPage: boolean;
  run: (page: Page, ctx: ScenarioContext) => Promise<void>;
}

export const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

export const VISUAL_CUSTOMER = { name: 'Cliente Visual', email: 'visual@mingocogus.test' };

// Congela o que muda com o tempo: o carrossel não avança sozinho durante a captura
export const FREEZE_SCRIPT = `(() => {
  const originalSetInterval = window.setInterval;
  window.setInterval = (handler, timeout, ...args) =>
    timeout >= 5000 ? 0 : originalSetInterval(handler, timeout, ...args);
})();`;

// Imagem neutra servida no lugar de qualquer recurso externo (ex.: o fallback via.placeholder.com
// das seções estáticas, um serviço que não existe mais): captura determinística e offline
const EXTERNAL_STUB = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#2a2a2a"/></svg>`;

// Preparação comum aos dois sites: congela timers longos e isola a captura da internet
export async function prepareContext(context: BrowserContext) {
  await context.addInitScript(FREEZE_SCRIPT);
  await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: EXTERNAL_STUB }),
  );
}

// Espera a página estabilizar: requisições, imagens (inclusive as lazy) e fontes
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    // Imagens lazy fora da tela (ex.: itens escondidos do carrossel) nunca carregam: espera no máximo 2s
    const pendingImages = [...document.images]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
      );
    await Promise.race([
      Promise.all(pendingImages),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    await document.fonts.ready;
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

const categoryUrl = (app: AppKind) =>
  app === 'ico'
    ? '/products?category=Seringas%20de%20Esporos'
    : '/products?category=seringas-esporos';

const CART_ITEMS = [
  { slug: 'b-plus-seringa-de-esporos', quantity: 2 },
  { slug: 'amazonian-seringa-de-esporos', quantity: 1 },
];

async function openCheckout(page: Page, ctx: ScenarioContext) {
  await ctx.login();
  await ctx.fillCart(CART_ITEMS);
  await page.goto('/checkout');
  await page.locator('#name').waitFor();
  await page.fill('#name', VISUAL_CUSTOMER.name);
  await page.fill('#email', VISUAL_CUSTOMER.email);
  await page.fill('#phone', '11999990000');
}

async function fillAddress(page: Page) {
  await page.getByRole('button', { name: 'Continuar para Entrega' }).click();
  await page.fill('#street', 'Rua das Flores');
  await page.fill('#number', '123');
  await page.fill('#complement', 'Apto 4');
  await page.fill('#neighborhood', 'Centro');
  await page.fill('#city', 'São Paulo');
  await page.fill('#state', 'SP');
  await page.fill('#zipCode', '01310-100');
}

export const SCENARIOS: Scenario[] = [
  {
    name: 'home',
    fullPage: true,
    run: async (page) => {
      await page.goto('/');
      await page.locator('.section-award .product-card').first().waitFor();
      await settle(page);
    },
  },
  {
    name: 'catalogo',
    fullPage: true,
    run: async (page) => {
      await page.goto('/products');
      await page.locator('.products-grid .product-card').first().waitFor();
      await settle(page);
    },
  },
  {
    name: 'catalogo-categoria',
    fullPage: true,
    run: async (page, { app }) => {
      await page.goto(categoryUrl(app));
      await page.locator('.products-grid .product-card').first().waitFor();
      await settle(page);
    },
  },
  {
    name: 'catalogo-busca',
    fullPage: true,
    run: async (page) => {
      await page.goto('/products?search=golden');
      await page.locator('.products-grid .product-card').first().waitFor();
      await settle(page);
    },
  },
  {
    name: 'menu-categorias',
    fullPage: false,
    run: async (page) => {
      await page.goto('/');
      await page.locator('.category-item').first().waitFor();
      await settle(page);
      await page.locator('.category-item').nth(1).hover();
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'carrinho',
    fullPage: true,
    run: async (page, ctx) => {
      await ctx.fillCart(CART_ITEMS);
      await page.goto('/cart');
      await page.locator('.cart-item').first().waitFor();
      await settle(page);
    },
  },
  {
    name: 'modal-login',
    fullPage: false,
    run: async (page) => {
      await page.goto('/');
      await settle(page);
      await page.locator('.login-link').click();
      await page.locator('.auth-container').waitFor();
    },
  },
  {
    name: 'modal-cadastro',
    fullPage: false,
    run: async (page) => {
      await page.goto('/');
      await settle(page);
      await page.locator('.login-link').click();
      await page.getByRole('button', { name: 'Cadastre-se' }).click();
      await page.locator('#confirmPassword').waitFor();
    },
  },
  {
    name: 'menu-conta',
    fullPage: false,
    run: async (page, ctx) => {
      await ctx.login();
      await page.goto('/');
      await settle(page);
      await page.locator('.user-link').click();
      await page.locator('.user-dropdown-menu').waitFor();
    },
  },
  {
    name: 'checkout-etapa1',
    fullPage: true,
    run: async (page, ctx) => {
      await openCheckout(page, ctx);
      await settle(page);
    },
  },
  {
    name: 'checkout-etapa2',
    fullPage: true,
    run: async (page, ctx) => {
      await openCheckout(page, ctx);
      await fillAddress(page);
      await settle(page);
    },
  },
  {
    name: 'checkout-etapa3',
    fullPage: true,
    run: async (page, ctx) => {
      await openCheckout(page, ctx);
      await fillAddress(page);
      await page.getByRole('button', { name: 'Continuar para Pagamento' }).click();
      await page.locator('.order-summary .order-item').first().waitFor();
      await page.locator('input[value=pix]').check();
      await settle(page);
    },
  },
];
