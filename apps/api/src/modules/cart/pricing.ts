import {
  computeShippingCents,
  effectivePriceCents,
  lineTotalCents,
  sumCents,
  type CartLineIssue,
  type CartQuote,
  type CartQuoteLine,
} from '@mingo/shared';
import type { Prisma } from '../../generated/prisma/client';

export const quoteProductSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  salePriceCents: true,
  stock: true,
  isActive: true,
  archivedAt: true,
  category: { select: { name: true, isActive: true } },
  images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
} satisfies Prisma.ProductSelect;

export type QuoteProduct = Prisma.ProductGetPayload<{ select: typeof quoteProductSelect }>;

// Monta a cotação com os preços do banco. É a mesma função usada pelo carrinho
// e pela criação do pedido, então o valor exibido é sempre o valor cobrado.
export function quoteLines(
  products: QuoteProduct[],
  items: Array<{ productId: string; quantity: number }>,
): CartQuote {
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines = items.map(({ productId, quantity }): CartQuoteLine => {
    const product = byId.get(productId);
    if (!product) {
      return {
        productId,
        name: 'Produto indisponível',
        slug: '',
        imageUrl: null,
        categoryName: '',
        priceCents: 0,
        unitPriceCents: 0,
        quantity,
        stock: 0,
        lineTotalCents: 0,
        issues: ['UNAVAILABLE'],
      };
    }

    const available = product.isActive && !product.archivedAt && product.category.isActive;
    const issues: CartLineIssue[] = [];
    if (!available) issues.push('UNAVAILABLE');
    else if (product.stock < quantity) issues.push('INSUFFICIENT_STOCK');

    const unitPriceCents = effectivePriceCents(product);
    return {
      productId,
      name: product.name,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
      categoryName: product.category.name,
      priceCents: product.priceCents,
      unitPriceCents,
      quantity,
      stock: product.stock,
      lineTotalCents: lineTotalCents(unitPriceCents, quantity),
      issues,
    };
  });

  const subtotalCents = sumCents(
    lines.filter((line) => !line.issues.includes('UNAVAILABLE')).map((line) => line.lineTotalCents),
  );
  const shippingCents = computeShippingCents(subtotalCents);
  return {
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    hasIssues: lines.some((line) => line.issues.length > 0),
  };
}
