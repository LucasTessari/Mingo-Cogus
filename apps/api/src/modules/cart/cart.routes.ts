import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { cartQuote, cartQuoteInput } from '@mingo/shared';
import { RATE_LIMITS } from '../../plugins/security';
import { quoteLines, quoteProductSelect } from './pricing';

export const cartRoutes: FastifyPluginAsyncZod = async (app) => {
  // Preços, disponibilidade e totais atuais dos itens do carrinho
  app.post(
    '/cart/quote',
    {
      schema: { body: cartQuoteInput, response: { 200: cartQuote } },
      config: { rateLimit: RATE_LIMITS.cartQuote },
    },
    async (request) => {
      const { items } = request.body;
      const products = await app.prisma.product.findMany({
        where: { id: { in: items.map((item) => item.productId) } },
        select: quoteProductSelect,
      });
      return quoteLines(products, items);
    },
  );
};
