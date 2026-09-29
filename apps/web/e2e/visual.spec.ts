// Paridade visual: cada cenário do site novo precisa ficar idêntico à screenshot de referência
// capturada do site original (tools/visual-baseline). Para regerar as referências:
// `npm run visual:baseline`. Nunca atualize as referências a partir do site novo.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import type { Paginated, ProductSummary } from '@mingo/shared';
import { effectivePriceCents } from '@mingo/shared';
import {
  SCENARIOS,
  VIEWPORTS,
  prepareContext,
  type ScenarioContext,
} from '../../../tools/visual-baseline/scenarios';
import { resetE2EDatabase } from './database';
import { E2E_CUSTOMER } from './e2e-env';

// As referências usam o catálogo do seed intacto: limpa o que os testes E2E tenham alterado
test.beforeAll(async () => {
  test.setTimeout(120_000);
  await resetE2EDatabase();
});

function newAppContext(page: Page, context: BrowserContext): ScenarioContext {
  return {
    app: 'new',
    login: async () => {
      const response = await page.request.post('/api/auth/login', {
        data: { email: E2E_CUSTOMER.email, password: E2E_CUSTOMER.password },
      });
      expect(response.ok()).toBe(true);
    },
    fillCart: async (items) => {
      const catalog = (await (
        await page.request.get('/api/products?limit=48')
      ).json()) as Paginated<ProductSummary>;
      const cartItems = items.map(({ slug, quantity }) => {
        const product = catalog.items.find((candidate) => candidate.slug === slug)!;
        return {
          productId: product.id,
          quantity,
          snapshot: {
            name: product.name,
            imageUrl: product.imageUrl,
            categoryName: product.category.name,
            unitPriceCents: effectivePriceCents(product),
            stock: product.stock,
          },
        };
      });
      const stored = JSON.stringify({ state: { items: cartItems }, version: 1 });
      await context.addInitScript((value) => localStorage.setItem('mingo-cart', value), stored);
    },
  };
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    for (const scenario of SCENARIOS) {
      test(scenario.name, async ({ page, context }) => {
        await prepareContext(context);
        await scenario.run(page, newAppContext(page, context));
        await expect(page).toHaveScreenshot(`${scenario.name}-${viewport.name}.png`, {
          fullPage: scenario.fullPage,
        });
      });
    }
  });
}
