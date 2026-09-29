import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_ITEM_QUANTITY,
  effectivePriceCents,
  type CartQuote,
  type ProductSummary,
} from '@mingo/shared';

// Dados do produto guardados no carrinho só para exibição imediata;
// preços e totais exibidos vêm sempre da cotação do servidor.
export interface CartSnapshot {
  name: string;
  imageUrl: string | null;
  categoryName: string;
  unitPriceCents: number;
  stock: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
  snapshot: CartSnapshot;
}

interface CartState {
  items: CartLine[];
  add: (product: ProductSummary) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  applyQuote: (quote: CartQuote) => void;
}

const maxQuantity = (stock: number) => Math.min(stock, MAX_ITEM_QUANTITY);

const snapshotOf = (product: ProductSummary): CartSnapshot => ({
  name: product.name,
  imageUrl: product.imageUrl,
  categoryName: product.category.name,
  unitPriceCents: effectivePriceCents(product),
  stock: product.stock,
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product) =>
        set(({ items }) => {
          const existing = items.find((item) => item.productId === product.id);
          const snapshot = snapshotOf(product);
          if (!existing)
            return { items: [...items, { productId: product.id, quantity: 1, snapshot }] };
          return {
            items: items.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    snapshot,
                    quantity: Math.min(item.quantity + 1, maxQuantity(product.stock)),
                  }
                : item,
            ),
          };
        }),

      setQuantity: (productId, quantity) =>
        set(({ items }) => ({
          items:
            quantity <= 0
              ? items.filter((item) => item.productId !== productId)
              : items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        })),

      remove: (productId) =>
        set(({ items }) => ({ items: items.filter((item) => item.productId !== productId) })),

      clear: () => set({ items: [] }),

      // Atualiza nome, preço e estoque com os dados do servidor
      applyQuote: (quote) =>
        set(({ items }) => ({
          items: items.map((item) => {
            const line = quote.lines.find((quoteLine) => quoteLine.productId === item.productId);
            if (!line || line.issues.includes('UNAVAILABLE')) return item;
            return {
              ...item,
              snapshot: {
                name: line.name,
                imageUrl: line.imageUrl,
                categoryName: line.categoryName,
                unitPriceCents: line.unitPriceCents,
                stock: line.stock,
              },
            };
          }),
        })),
    }),
    { name: 'mingo-cart', version: 1 },
  ),
);

export const useCartCount = () =>
  useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

export const useCartLine = (productId: string) =>
  useCartStore((state) => state.items.find((item) => item.productId === productId));
