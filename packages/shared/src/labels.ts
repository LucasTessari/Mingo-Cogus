import type {
  CultivationMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Potency,
  ProductTag,
} from './enums';

// Rótulos exibidos na loja (mesmos textos do site original)

export const POTENCY_LABELS: Record<Potency, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  VERY_HIGH: 'Muito Alta',
};

export const CULTIVATION_METHOD_LABELS: Record<CultivationMethod, string> = {
  SPORE_SYRINGE: 'Seringa de Esporos',
  SPORE_PRINT: 'Impressão de Esporos',
  LIQUID_CULTURE: 'Cultura Líquida',
  GRAIN_SPAWN: 'Grão Inoculado',
  GROW_KIT: 'Kit de Cultivo',
};

// `label` é o texto do selo no card e `badge` o sufixo da classe `badge-*`
export const TAG_META: Record<ProductTag, { label: string; badge: string }> = {
  NEW: { label: 'novo', badge: 'novo' },
  BEST_SELLER: { label: 'mais vendido', badge: 'mais-vendido' },
  EASY_GROW: { label: 'cultivo facil', badge: 'cultivo-facil' },
  HIGH_POTENCY: { label: 'alta potencia', badge: 'alta-potencia' },
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Aguardando',
  APPROVED: 'Aprovado',
  DECLINED: 'Recusado',
  REFUNDED: 'Estornado',
};

// "mais vendido" -> "Mais Vendido"
export const toTitleCase = (text: string): string =>
  text.replace(/\b\w/g, (letter) => letter.toUpperCase());
