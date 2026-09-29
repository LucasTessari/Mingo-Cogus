import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { adminCategoryRoutes } from './admin-categories.routes';
import { adminOrderRoutes } from './admin-orders.routes';
import { adminProductRoutes } from './admin-products.routes';

// Todo o escopo /admin exige um administrador (anônimo: 401, usuário comum: 403)
export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  // onRequest: autoriza antes de validar o corpo (anônimo 401, usuário comum 403, nunca 400)
  app.addHook('onRequest', app.requireAdmin);
  await app.register(adminProductRoutes);
  await app.register(adminCategoryRoutes);
  await app.register(adminOrderRoutes);
};
