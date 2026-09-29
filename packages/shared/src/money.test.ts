import { describe, expect, test } from 'vitest';
import {
  discountPercent,
  effectivePriceCents,
  formatPrice,
  formatPriceComma,
  isOnSale,
  parseBRL,
} from './money';

describe('preço efetivo', () => {
  test('usa o preço promocional quando existe', () => {
    expect(effectivePriceCents({ priceCents: 8990, salePriceCents: 7990 })).toBe(7990);
    expect(effectivePriceCents({ priceCents: 8990, salePriceCents: null })).toBe(8990);
    expect(effectivePriceCents({ priceCents: 8990 })).toBe(8990);
  });

  test('promoção e desconto', () => {
    expect(isOnSale({ priceCents: 8990, salePriceCents: 7990 })).toBe(true);
    expect(isOnSale({ priceCents: 8990, salePriceCents: null })).toBe(false);
    expect(discountPercent({ priceCents: 8990, salePriceCents: 7990 })).toBe(11);
    expect(discountPercent({ priceCents: 19990, salePriceCents: 17990 })).toBe(10);
    expect(discountPercent({ priceCents: 8990 })).toBe(0);
  });
});

describe('formatação', () => {
  test('formato da loja', () => {
    expect(formatPrice(7990)).toBe('R$ 79.90');
    expect(formatPrice(12900)).toBe('R$ 129.00');
    expect(formatPriceComma(12900)).toBe('R$ 129,00');
  });

  test('parseBRL', () => {
    expect(parseBRL('89,90')).toBe(8990);
    expect(parseBRL('89.90')).toBe(8990);
    expect(parseBRL('R$ 1.234,56')).toBe(123456);
    expect(parseBRL('10')).toBe(1000);
    expect(parseBRL('abc')).toBeNull();
    expect(parseBRL('')).toBeNull();
  });
});
