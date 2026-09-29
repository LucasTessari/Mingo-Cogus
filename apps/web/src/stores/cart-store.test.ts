import { beforeEach, describe, expect, test } from 'vitest';
import type { CartQuote, ProductSummary } from '@mingo/shared';
import { useCartStore } from './cart-store';

const product = (id: string, overrides: Partial<ProductSummary> = {}): ProductSummary => ({
  id,
  slug: id,
  name: `Produto ${id}`,
  description: '',
  priceCents: 1000,
  salePriceCents: null,
  effectivePriceCents: 1000,
  stock: 5,
  featured: false,
  awardWinning: false,
  tags: [],
  species: null,
  strain: null,
  potency: null,
  cultivationMethod: null,
  quantityLabel: null,
  ratingAvg: null,
  reviewCount: 0,
  imageUrl: null,
  category: { id: 'c', slug: 'c', name: 'Categoria' },
  ...overrides,
});

const items = () => useCartStore.getState().items;

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe('carrinho', () => {
  test('produtos diferentes viram itens separados; o mesmo produto soma quantidade', () => {
    const { add } = useCartStore.getState();
    add(product('a'));
    add(product('b'));
    add(product('a'));
    expect(items().map((item) => [item.productId, item.quantity])).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
  });

  test('não passa do estoque', () => {
    const { add } = useCartStore.getState();
    for (let i = 0; i < 5; i++) add(product('a', { stock: 2 }));
    expect(items()[0]!.quantity).toBe(2);
  });

  test('guarda o preço efetivo (promocional) para exibição', () => {
    useCartStore.getState().add(product('a', { priceCents: 1000, salePriceCents: 800 }));
    expect(items()[0]!.snapshot.unitPriceCents).toBe(800);
  });

  test('quantidade zero remove o item; limpar esvazia', () => {
    const { add, setQuantity, clear } = useCartStore.getState();
    add(product('a'));
    add(product('b'));
    setQuantity('a', 0);
    expect(items().map((item) => item.productId)).toEqual(['b']);
    clear();
    expect(items()).toEqual([]);
  });

  test('a cotação do servidor atualiza preço e estoque guardados', () => {
    useCartStore.getState().add(product('a'));
    const quote: CartQuote = {
      lines: [
        {
          productId: 'a',
          name: 'Nome novo',
          slug: 'a',
          imageUrl: null,
          categoryName: 'Categoria',
          priceCents: 1500,
          unitPriceCents: 1200,
          quantity: 1,
          stock: 3,
          lineTotalCents: 1200,
          issues: [],
        },
      ],
      subtotalCents: 1200,
      shippingCents: 0,
      totalCents: 1200,
      hasIssues: false,
    };
    useCartStore.getState().applyQuote(quote);
    expect(items()[0]!.snapshot).toMatchObject({
      name: 'Nome novo',
      unitPriceCents: 1200,
      stock: 3,
    });
  });

  test('persiste no localStorage', () => {
    useCartStore.getState().add(product('a'));
    expect(JSON.parse(localStorage.getItem('mingo-cart')!).state.items[0].productId).toBe('a');
  });
});
