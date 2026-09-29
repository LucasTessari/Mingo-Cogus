import type { PaymentMethod } from '@mingo/shared';

export interface ChargeInput {
  paymentId: string;
  orderNumber: string;
  amountCents: number;
  method: PaymentMethod;
  installments: number;
  customer: { name: string; email: string };
}

export type ChargeResult =
  | { status: 'APPROVED'; providerRef: string }
  | { status: 'PENDING'; providerRef: string; pixCode?: string }
  | { status: 'DECLINED'; providerRef?: string; reason: string };

// Contrato para plugar um gateway real. Nenhum dado de cartão passa pela API:
// um gateway real tokeniza o cartão no navegador e envia só o token.
export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: { providerRef: string; amountCents: number }): Promise<{ ok: boolean }>;
}
