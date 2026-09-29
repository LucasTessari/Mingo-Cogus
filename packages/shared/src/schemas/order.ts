import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../enums';
import { normalizeCep } from '../br';
import { cartItemsInput } from './cart';
import { queryIntWithDefault } from './common';

const required = (label: string, max: number) =>
  z.string().trim().min(1, `Informe ${label}`).max(max);

export const customerInfo = z.object({
  name: required('o nome', 80),
  email: z.string().trim().toLowerCase().pipe(z.email('Email inválido')),
  phone: required('o telefone', 20),
});
export type CustomerInfo = z.infer<typeof customerInfo>;

export const shippingAddress = z.object({
  street: required('a rua', 120),
  number: required('o número', 20),
  complement: z.string().trim().max(80).optional(),
  neighborhood: required('o bairro', 80),
  city: required('a cidade', 80),
  state: required('o estado', 40),
  zipCode: z.string().transform(normalizeCep).pipe(z.string().length(8, 'CEP deve ter 8 dígitos')),
});
export type ShippingAddress = z.infer<typeof shippingAddress>;
export type ShippingAddressInput = z.input<typeof shippingAddress>;

// Não há nenhum campo de preço: o servidor calcula tudo a partir do banco.
// `expectedTotalCents` só confirma que o cliente viu o mesmo total que será cobrado.
export const createOrderInput = z.strictObject({
  items: cartItemsInput,
  customer: customerInfo,
  shippingAddress,
  paymentMethod: z.enum(PAYMENT_METHODS),
  expectedTotalCents: z.number().int().min(0),
});
export type CreateOrderInput = z.input<typeof createOrderInput>;

export const orderItem = z.object({
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  imageUrl: z.string().nullable(),
  unitPriceCents: z.number().int(),
  quantity: z.number().int(),
  lineTotalCents: z.number().int(),
});
export type OrderItem = z.infer<typeof orderItem>;

export const orderPayment = z.object({
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  pixCode: z.string().nullable(),
});

export const orderEvent = z.object({
  fromStatus: z.enum(ORDER_STATUSES).nullable(),
  toStatus: z.enum(ORDER_STATUSES),
  note: z.string().nullable(),
  actorName: z.string().nullable(),
  createdAt: z.string(),
});

export const orderDetail = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.enum(ORDER_STATUSES),
  createdAt: z.string(),
  subtotalCents: z.number().int(),
  shippingCents: z.number().int(),
  totalCents: z.number().int(),
  items: z.array(orderItem),
  customer: customerInfo,
  shippingAddress: shippingAddress.extend({ zipCode: z.string(), country: z.string() }),
  payment: orderPayment,
  trackingNumber: z.string().nullable(),
  estimatedDeliveryAt: z.string().nullable(),
  events: z.array(orderEvent),
});
export type OrderDetail = z.infer<typeof orderDetail>;

export const orderListQuery = z.object({
  page: queryIntWithDefault(1, 1),
  limit: queryIntWithDefault(1, 10, 48),
});

export const orderNumberParam = z.object({ orderNumber: z.string().max(30) });
