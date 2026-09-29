import fp from 'fastify-plugin';
import type { PaymentProvider } from '../modules/payments/provider';

declare module 'fastify' {
  interface FastifyInstance {
    payments: PaymentProvider;
  }
}

export const paymentsPlugin = fp<{ provider: PaymentProvider }>(async (app, { provider }) => {
  app.decorate('payments', provider);
});
