// Mesmos valores dos enums do Prisma (um teste da API garante que não divergem)

export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const POTENCIES = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;
export type Potency = (typeof POTENCIES)[number];

export const CULTIVATION_METHODS = [
  'SPORE_SYRINGE',
  'SPORE_PRINT',
  'LIQUID_CULTURE',
  'GRAIN_SPAWN',
  'GROW_KIT',
] as const;
export type CultivationMethod = (typeof CULTIVATION_METHODS)[number];

// Destaque, premiado e promoção são campos do produto, não tags
export const PRODUCT_TAGS = ['NEW', 'BEST_SELLER', 'EASY_GROW', 'HIGH_POTENCY'] as const;
export type ProductTag = (typeof PRODUCT_TAGS)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CREDIT_CARD', 'DEBIT_CARD', 'PIX'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'DECLINED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_SORT_FIELDS = ['createdAt', 'price', 'name', 'rating'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];
