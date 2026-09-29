import type { OrderStatus } from '@mingo/shared';

// Cor do selo de status do pedido no painel
export const statusPillClass = (status: OrderStatus) =>
  status === 'CANCELLED' ? 'off' : status === 'PENDING' ? 'warn' : 'ok';
