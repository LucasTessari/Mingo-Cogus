import { z } from 'zod';

export const MAX_ITEM_QUANTITY = 99;

export const cartItemInput = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

export const cartItemsInput = z
  .array(cartItemInput)
  .min(1)
  .max(50)
  .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
    message: 'Produtos repetidos no carrinho',
  });

export const cartQuoteInput = z.object({ items: cartItemsInput });
export type CartQuoteInput = z.infer<typeof cartQuoteInput>;

export const CART_LINE_ISSUES = ['UNAVAILABLE', 'INSUFFICIENT_STOCK'] as const;
export type CartLineIssue = (typeof CART_LINE_ISSUES)[number];

export const cartQuoteLine = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  categoryName: z.string(),
  priceCents: z.number().int(),
  unitPriceCents: z.number().int(),
  quantity: z.number().int(),
  stock: z.number().int(),
  lineTotalCents: z.number().int(),
  issues: z.array(z.enum(CART_LINE_ISSUES)),
});
export type CartQuoteLine = z.infer<typeof cartQuoteLine>;

export const cartQuote = z.object({
  lines: z.array(cartQuoteLine),
  subtotalCents: z.number().int(),
  shippingCents: z.number().int(),
  totalCents: z.number().int(),
  hasIssues: z.boolean(),
});
export type CartQuote = z.infer<typeof cartQuote>;
