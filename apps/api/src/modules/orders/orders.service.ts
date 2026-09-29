import type { FastifyInstance } from 'fastify';
import { canTransition, type OrderStatus, type createOrderInput } from '@mingo/shared';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { AppError, notFound } from '../../lib/app-error';
import { addDays, yyyymmddSaoPaulo } from '../../lib/dates';
import { quoteLines, quoteProductSelect } from '../cart/pricing';
import type { ChargeResult } from '../payments/provider';
import { orderDetailInclude, toOrderDetail } from './order-mappers';

type TransactionClient = Prisma.TransactionClient;
type CreateOrderData = z.output<typeof createOrderInput>;

const DELIVERY_ESTIMATE_DAYS = 7;

const isIdempotencyConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' &&
  JSON.stringify(error.meta ?? {}).includes('idempotencyKey');

// MC-20260928-000042, com o sequencial vindo de uma sequence do Postgres (sem colisões)
async function nextOrderNumber(tx: TransactionClient, now: Date): Promise<string> {
  const [row] = await tx.$queryRaw<Array<{ n: bigint }>>`SELECT nextval('order_number_seq') AS n`;
  return `MC-${yyyymmddSaoPaulo(now)}-${String(row!.n).padStart(6, '0')}`;
}

async function restoreStock(tx: TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true },
  });
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

const loadOrderDetail = (app: FastifyInstance, where: Prisma.OrderWhereUniqueInput) =>
  app.prisma.order.findUnique({ where, include: orderDetailInclude });

// Cria o pedido: preços e estoque vêm do banco, a baixa de estoque é atômica e o
// pagamento acontece fora da transação. Repetir a mesma Idempotency-Key devolve o mesmo pedido.
export async function createOrder(
  app: FastifyInstance,
  userId: string,
  input: CreateOrderData,
  idempotencyKey: string,
) {
  const replayKey = { userId_idempotencyKey: { userId, idempotencyKey } };
  const existing = await loadOrderDetail(app, replayKey);
  if (existing) return { order: toOrderDetail(existing), created: false };

  let order;
  try {
    order = await app.prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({
          where: { id: { in: input.items.map((item) => item.productId) } },
          select: quoteProductSelect,
        });
        const quote = quoteLines(products, input.items);

        if (quote.lines.some((line) => line.issues.includes('UNAVAILABLE'))) {
          throw new AppError(
            409,
            'PRODUCT_UNAVAILABLE',
            'Alguns produtos não estão mais disponíveis',
            { quote },
          );
        }
        if (quote.lines.some((line) => line.issues.includes('INSUFFICIENT_STOCK'))) {
          throw new AppError(
            409,
            'INSUFFICIENT_STOCK',
            'Estoque insuficiente para alguns produtos',
            { quote },
          );
        }
        if (quote.totalCents !== input.expectedTotalCents) {
          throw new AppError(
            409,
            'PRICE_CHANGED',
            'Os preços foram atualizados. Confira o pedido.',
            { quote },
          );
        }

        // Baixa condicional (só se ainda houver estoque), em ordem fixa para evitar deadlock
        const sortedItems = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));
        for (const item of sortedItems) {
          const { count } = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (count === 0) {
            throw new AppError(
              409,
              'INSUFFICIENT_STOCK',
              'Estoque insuficiente para alguns produtos',
              { quote },
            );
          }
        }

        const now = new Date();
        const { customer, shippingAddress } = input;
        return tx.order.create({
          data: {
            orderNumber: await nextOrderNumber(tx, now),
            userId,
            idempotencyKey,
            subtotalCents: quote.subtotalCents,
            shippingCents: quote.shippingCents,
            totalCents: quote.totalCents,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shipZipCode: shippingAddress.zipCode,
            shipStreet: shippingAddress.street,
            shipNumber: shippingAddress.number,
            shipComplement: shippingAddress.complement || null,
            shipNeighborhood: shippingAddress.neighborhood,
            shipCity: shippingAddress.city,
            shipState: shippingAddress.state,
            estimatedDeliveryAt: addDays(now, DELIVERY_ESTIMATE_DAYS),
            items: {
              create: quote.lines.map((line) => ({
                productId: line.productId,
                productName: line.name,
                productSlug: line.slug,
                imageUrl: line.imageUrl,
                listPriceCents: line.priceCents,
                unitPriceCents: line.unitPriceCents,
                quantity: line.quantity,
                lineTotalCents: line.lineTotalCents,
              })),
            },
            payments: {
              create: {
                provider: app.payments.name,
                method: input.paymentMethod,
                amountCents: quote.totalCents,
              },
            },
            events: { create: { toStatus: 'PENDING', note: 'Pedido criado' } },
          },
          include: { payments: true },
        });
      },
      { timeout: 10_000 },
    );
  } catch (error) {
    // Duas requisições simultâneas com a mesma chave: a segunda devolve o pedido da primeira
    if (isIdempotencyConflict(error)) {
      const winner = await loadOrderDetail(app, replayKey);
      if (winner) return { order: toOrderDetail(winner), created: false };
    }
    throw error;
  }

  const payment = order.payments[0]!;
  try {
    const result = await app.payments.charge({
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      amountCents: order.totalCents,
      method: payment.method,
      installments: payment.installments,
      customer: { name: order.customerName, email: order.customerEmail },
    });
    await applyPaymentResult(app, payment.id, result);
  } catch (error) {
    // Falha de comunicação com o provedor: o pagamento fica pendente para conciliação
    app.log.error({ err: error, orderNumber: order.orderNumber }, 'falha ao processar pagamento');
  }

  const detail = await loadOrderDetail(app, { id: order.id });
  return { order: toOrderDetail(detail!), created: true };
}

// Aplica o resultado do provedor a um pagamento ainda pendente. Pode ser chamada mais de
// uma vez com segurança (servirá também ao webhook de um gateway real).
export async function applyPaymentResult(
  app: FastifyInstance,
  paymentId: string,
  result: ChargeResult,
) {
  await app.prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'PENDING') return;
    const now = new Date();

    if (result.status === 'PENDING') {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          providerRef: result.providerRef,
          metadata: result.pixCode ? { pixCode: result.pixCode } : undefined,
        },
      });
      return;
    }

    if (result.status === 'APPROVED') {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'APPROVED', providerRef: result.providerRef, paidAt: now },
      });
      const { count } = await tx.order.updateMany({
        where: { id: payment.orderId, status: 'PENDING' },
        data: { status: 'CONFIRMED', confirmedAt: now },
      });
      if (count > 0) {
        await tx.orderStatusEvent.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING',
            toStatus: 'CONFIRMED',
            note: 'Pagamento aprovado',
          },
        });
      }
      return;
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'DECLINED',
        providerRef: result.providerRef ?? null,
        failureReason: result.reason,
      },
    });
    const { count } = await tx.order.updateMany({
      where: { id: payment.orderId, status: 'PENDING' },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    if (count > 0) {
      await restoreStock(tx, payment.orderId);
      await tx.orderStatusEvent.create({
        data: {
          orderId: payment.orderId,
          fromStatus: 'PENDING',
          toStatus: 'CANCELLED',
          note: 'Pagamento recusado',
        },
      });
    }
  });
}

// Mudança de status feita por um admin, com as regras de transição e seus efeitos
export async function changeOrderStatus(
  app: FastifyInstance,
  orderNumber: string,
  change: { status: OrderStatus; trackingNumber?: string | null; note?: string | null },
  actorId: string,
) {
  const refund = await app.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw notFound('Pedido não encontrado');

    if (!canTransition(order.status, change.status)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Essa mudança de status não é permitida',
      );
    }
    if (change.status === 'SHIPPED' && !change.trackingNumber) {
      throw new AppError(
        400,
        'TRACKING_REQUIRED',
        'Informe o código de rastreio para marcar como enviado',
      );
    }

    const now = new Date();
    const timestamps: Prisma.OrderUpdateManyMutationInput = {
      CONFIRMED: { confirmedAt: now },
      SHIPPED: { shippedAt: now, trackingNumber: change.trackingNumber },
      DELIVERED: { deliveredAt: now },
      CANCELLED: { cancelledAt: now },
      PENDING: {},
    }[change.status];

    // Update condicional: se outro admin mudou o status ao mesmo tempo, nada acontece
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: change.status, ...timestamps },
    });
    if (count === 0) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        'O pedido foi alterado por outra pessoa. Recarregue.',
      );
    }

    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: change.status,
        note: change.note ?? null,
        actorId,
      },
    });

    const payment = order.payments[0];
    if (change.status === 'CONFIRMED' && payment?.status === 'PENDING') {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'APPROVED', paidAt: now },
      });
    }
    if (change.status === 'CANCELLED') {
      await restoreStock(tx, order.id);
      if (payment?.status === 'APPROVED') return payment;
    }
    return null;
  });

  // Estorno fora da transação (chamada ao provedor)
  if (refund) {
    const { ok } = await app.payments.refund({
      providerRef: refund.providerRef ?? '',
      amountCents: refund.amountCents,
    });
    if (ok)
      await app.prisma.payment.update({ where: { id: refund.id }, data: { status: 'REFUNDED' } });
  }

  const detail = await app.prisma.order.findUnique({
    where: { orderNumber },
    include: orderDetailInclude,
  });
  return toOrderDetail(detail!);
}
