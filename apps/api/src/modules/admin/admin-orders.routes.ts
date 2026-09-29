import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  ORDER_STATUSES,
  adminOrderDetail,
  adminOrderListQuery,
  adminOrderPage,
  adminSummary,
  orderDetail,
  orderNumberParam,
  orderStatusUpdate,
} from '@mingo/shared';
import type { Prisma } from '../../generated/prisma/client';
import { notFound } from '../../lib/app-error';
import { pageArgs, toPage } from '../../lib/pagination';
import { orderDetailInclude, toOrderDetail } from '../orders/order-mappers';
import { changeOrderStatus } from '../orders/orders.service';

const LOW_STOCK_THRESHOLD = 5;

export const adminOrderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/orders',
    { schema: { querystring: adminOrderListQuery, response: { 200: adminOrderPage } } },
    async (request) => {
      const { status, search, page, limit } = request.query;
      const where: Prisma.OrderWhereInput = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };
      const [orders, total] = await Promise.all([
        app.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...pageArgs(page, limit),
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { method: true, status: true },
            },
            _count: { select: { items: true } },
          },
        }),
        app.prisma.order.count({ where }),
      ]);
      const items = orders.map((order) => ({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalCents: order.totalCents,
        paymentMethod: order.payments[0]?.method ?? 'PIX',
        paymentStatus: order.payments[0]?.status ?? 'PENDING',
        itemCount: order._count.items,
      }));
      return toPage(items, total, page, limit);
    },
  );

  app.get(
    '/orders/:orderNumber',
    { schema: { params: orderNumberParam, response: { 200: adminOrderDetail } } },
    async (request) => {
      const order = await app.prisma.order.findUnique({
        where: { orderNumber: request.params.orderNumber },
        include: { ...orderDetailInclude, user: { select: { id: true, name: true, email: true } } },
      });
      if (!order) throw notFound('Pedido não encontrado');
      return { ...toOrderDetail(order), user: order.user };
    },
  );

  app.patch(
    '/orders/:orderNumber/status',
    {
      schema: { params: orderNumberParam, body: orderStatusUpdate, response: { 200: orderDetail } },
    },
    async (request) =>
      changeOrderStatus(app, request.params.orderNumber, request.body, request.auth!.userId),
  );

  app.get('/summary', { schema: { response: { 200: adminSummary } } }, async () => {
    const [counts, lowStock] = await Promise.all([
      app.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      app.prisma.product.findMany({
        where: { archivedAt: null, isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: 'asc' },
        take: 20,
        select: { id: true, name: true, stock: true },
      }),
    ]);
    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
    for (const row of counts) ordersByStatus[row.status] = row._count._all;
    return { ordersByStatus, lowStock };
  });
};
