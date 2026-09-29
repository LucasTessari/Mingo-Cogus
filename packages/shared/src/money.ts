// Todo valor monetário é um inteiro em centavos; estas são as únicas regras de preço do sistema.

export interface Priced {
  priceCents: number;
  salePriceCents?: number | null;
}

// Preço cobrado: o promocional quando existe
export const effectivePriceCents = ({ priceCents, salePriceCents }: Priced): number =>
  salePriceCents ?? priceCents;

export const isOnSale = ({ priceCents, salePriceCents }: Priced): boolean =>
  salePriceCents != null && salePriceCents < priceCents;

export const discountPercent = (product: Priced): number =>
  isOnSale(product)
    ? Math.round(((product.priceCents - product.salePriceCents!) / product.priceCents) * 100)
    : 0;

export const lineTotalCents = (unitPriceCents: number, quantity: number): number =>
  unitPriceCents * quantity;

export const sumCents = (values: number[]): number => values.reduce((sum, value) => sum + value, 0);

// Frete grátis na v1; ponto de extensão para cálculo de frete real
export const computeShippingCents = (_subtotalCents: number): number => 0;

// "R$ 89.90": formato exibido na loja
export const formatPrice = (cents: number): string => `R$ ${(cents / 100).toFixed(2)}`;

// "R$ 129,00": formato das seções de vitrine estáticas da home
export const formatPriceComma = (cents: number): string => formatPrice(cents).replace('.', ',');

// "89,90", "89.90", "R$ 1.234,56" -> centavos; null se não for um valor válido
export const parseBRL = (text: string): number | null => {
  const cleaned = text.replace(/[R$\s]/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(cleaned)) return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  return Math.round(Number(normalized) * 100);
};
