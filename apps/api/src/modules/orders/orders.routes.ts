import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  createOrderInput,
  orderDetail,
  orderListQuery,
  orderNumberParam,
  paginated,
} from '@mingo/shared';
import { AppError, notFound } from '../../lib/app-error';
import { pageArgs, toPage } from '../../lib/pagination';
import { RATE_LIMITS } from '../../plugins/security';
import { orderDetailInclude, toOrderDetail } from './order-mappers';
import { createOrder } from './orders.service';

const orderResponse = z.object({ order: orderDetail });

export const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  // onRequest: autentica antes de validar o corpo (anônimo recebe 401, não 400)
  app.addHook('onRequest', app.authenticate);

  app.post(
    '/orders',
    {
      schema: { body: createOrderInput, response: { 200: orderResponse, 201: orderResponse } },
      config: { rateLimit: RATE_LIMITS.orders },
    },
    async (request, reply) => {
      const idempotencyKey = request.headers['idempotency-key'];
      if (typeof idempotencyKey !== 'string' || !z.uuid().safeParse(idempotencyKey).success) {
        throw new AppError(
          400,
          'IDEMPOTENCY_KEY_REQUIRED',
          'Cabeçalho Idempotency-Key (uuid) obrigatório',
        );
      }
      const { order, created } = await createOrder(
        app,
        request.auth!.userId,
        request.body,
        idempotencyKey,
      );
      return reply.status(created ? 201 : 200).send({ order });
    },
  );

  // Pedidos do usuário logado, do mais recente para o mais antigo
  app.get(
    '/orders',
    { schema: { querystring: orderListQuery, response: { 200: paginated(orderDetail) } } },
    async (request) => {
      const { page, limit } = request.query;
      const where = { userId: request.auth!.userId };
      const [orders, total] = await Promise.all([
        app.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...pageArgs(page, limit),
          include: orderDetailInclude,
        }),
        app.prisma.order.count({ where }),
      ]);
      return toPage(orders.map(toOrderDetail), total, page, limit);
    },
  );

  // Pedido de outra pessoa responde 404 (não revela que existe)
  app.get(
    '/orders/:orderNumber',
    { schema: { params: orderNumberParam, response: { 200: orderResponse } } },
    async (request) => {
      const order = await app.prisma.order.findFirst({
        where: { orderNumber: request.params.orderNumber, userId: request.auth!.userId },
        include: orderDetailInclude,
      });
      if (!order) throw notFound('Pedido não encontrado');
      return { order: toOrderDetail(order) };
    },
  );
};
