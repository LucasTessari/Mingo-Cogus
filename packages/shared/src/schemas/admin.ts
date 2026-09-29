import { z } from 'zod';
import { CULTIVATION_METHODS, ORDER_STATUSES, POTENCIES, PRODUCT_TAGS } from '../enums';
import { categoryRef } from './catalog';
import { orderDetail } from './order';
import {
  paginated,
  queryEnum,
  queryEnumWithDefault,
  queryIntWithDefault,
  queryText,
} from './common';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional();

// https://... ou um caminho do próprio site (/placeholders/x.svg)
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (url) => /^https:\/\//.test(url) || /^\/[^/]/.test(url),
    'Use uma URL https:// ou um caminho /...',
  );

// Slug opcional: vazio significa "gerar a partir do nome"
const optionalSlug = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || undefined)
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens')
      .optional(),
  );

export const productInput = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(100),
    slug: optionalSlug,
    description: z.string().trim().min(1, 'Informe a descrição').max(2000),
    categoryId: z.uuid('Selecione a categoria'),
    priceCents: z
      .number({ error: 'Informe o preço' })
      .int()
      .positive('O preço deve ser maior que zero'),
    salePriceCents: z.number({ error: 'Valor inválido' }).int().positive().nullable().optional(),
    stock: z.number({ error: 'Informe o estoque' }).int().min(0, 'O estoque não pode ser negativo'),
    featured: z.boolean().default(false),
    awardWinning: z.boolean().default(false),
    isActive: z.boolean().default(true),
    tags: z.array(z.enum(PRODUCT_TAGS)).default([]),
    species: optionalText(80),
    strain: optionalText(80),
    potency: z.enum(POTENCIES).nullable().optional(),
    cultivationMethod: z.enum(CULTIVATION_METHODS).nullable().optional(),
    quantityLabel: optionalText(30),
    origin: optionalText(60),
    images: z
      .array(z.object({ url: imageUrl, alt: optionalText(150) }))
      .max(8)
      .default([]),
  })
  .refine((p) => p.salePriceCents == null || p.salePriceCents < p.priceCents, {
    message: 'O preço promocional deve ser menor que o preço',
    path: ['salePriceCents'],
  });
export type ProductInput = z.input<typeof productInput>;

export const categoryInput = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(60),
  slug: optionalSlug,
  description: optionalText(500),
  iconKey: optionalText(40),
  imageUrl: imageUrl.nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  parentId: z.uuid().nullable().optional(),
});
export type CategoryInput = z.input<typeof categoryInput>;

export const PRODUCT_STATUS_FILTERS = ['active', 'inactive', 'archived', 'all'] as const;

export const adminProductListQuery = z.object({
  search: queryText(100),
  status: queryEnumWithDefault(PRODUCT_STATUS_FILTERS, 'active'),
  categoryId: queryText(40),
  page: queryIntWithDefault(1, 1),
  limit: queryIntWithDefault(1, 20, 100),
});

export const adminProduct = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  salePriceCents: z.number().int().nullable(),
  stock: z.number().int(),
  featured: z.boolean(),
  awardWinning: z.boolean(),
  isActive: z.boolean(),
  archivedAt: z.string().nullable(),
  tags: z.array(z.enum(PRODUCT_TAGS)),
  species: z.string().nullable(),
  strain: z.string().nullable(),
  potency: z.enum(POTENCIES).nullable(),
  cultivationMethod: z.enum(CULTIVATION_METHODS).nullable(),
  quantityLabel: z.string().nullable(),
  origin: z.string().nullable(),
  images: z.array(z.object({ url: z.string(), alt: z.string().nullable() })),
  category: categoryRef.extend({ id: z.string() }),
  categoryId: z.string(),
  updatedAt: z.string(),
});
export type AdminProduct = z.infer<typeof adminProduct>;
export const adminProductPage = paginated(adminProduct);

export const adminCategory = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  iconKey: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  parentId: z.string().nullable(),
  productCount: z.number().int(),
  childCount: z.number().int(),
});
export type AdminCategory = z.infer<typeof adminCategory>;

export const adminOrderListQuery = z.object({
  status: queryEnum(ORDER_STATUSES),
  search: queryText(100),
  page: queryIntWithDefault(1, 1),
  limit: queryIntWithDefault(1, 20, 100),
});

export const adminOrderSummary = z.object({
  orderNumber: z.string(),
  createdAt: z.string(),
  status: z.enum(ORDER_STATUSES),
  customerName: z.string(),
  customerEmail: z.string(),
  totalCents: z.number().int(),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  itemCount: z.number().int(),
});
export type AdminOrderSummary = z.infer<typeof adminOrderSummary>;
export const adminOrderPage = paginated(adminOrderSummary);

export const adminOrderDetail = orderDetail.extend({
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});
export type AdminOrderDetail = z.infer<typeof adminOrderDetail>;

export const orderStatusUpdate = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: optionalText(40),
  note: optionalText(300),
});
export type OrderStatusUpdate = z.input<typeof orderStatusUpdate>;

export const adminSummary = z.object({
  ordersByStatus: z.record(z.string(), z.number().int()),
  lowStock: z.array(z.object({ id: z.string(), name: z.string(), stock: z.number().int() })),
});
export type AdminSummary = z.infer<typeof adminSummary>;
