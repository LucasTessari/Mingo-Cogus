import type { OrderDetail } from '@mingo/shared';
import type { Prisma } from '../../generated/prisma/client';
import { toIso } from '../../lib/dates';

export const orderDetailInclude = {
  items: { orderBy: { productName: 'asc' } },
  payments: { orderBy: { createdAt: 'desc' }, take: 1 },
  events: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

export type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

const pixCodeOf = (metadata: Prisma.JsonValue | undefined): string | null => {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const code = metadata.pixCode;
    return typeof code === 'string' ? code : null;
  }
  return null;
};

export function toOrderDetail(order: OrderWithDetail): OrderDetail {
  const payment = order.payments[0];
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    shippingAddress: {
      street: order.shipStreet,
      number: order.shipNumber,
      complement: order.shipComplement ?? undefined,
      neighborhood: order.shipNeighborhood,
      city: order.shipCity,
      state: order.shipState,
      zipCode: order.shipZipCode,
      country: order.shipCountry,
    },
    payment: {
      method: payment?.method ?? 'PIX',
      status: payment?.status ?? 'PENDING',
      pixCode: pixCodeOf(payment?.metadata),
    },
    trackingNumber: order.trackingNumber,
    estimatedDeliveryAt: toIso(order.estimatedDeliveryAt),
    events: order.events.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      actorName: event.actor?.name ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}
