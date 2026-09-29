import { randomUUID } from 'node:crypto';
import type { ChargeInput, ChargeResult, PaymentProvider } from './provider';

export type SimulatedOutcome = 'approve' | 'decline' | 'pending';

// Pagamento simulado (v1): o resultado é definido por PAYMENT_SIMULATOR_OUTCOME
export class SimulatedPaymentProvider implements PaymentProvider {
  readonly name = 'simulated';

  constructor(private readonly outcome: SimulatedOutcome) {}

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const providerRef = `sim_${randomUUID()}`;
    if (this.outcome === 'decline') {
      return { status: 'DECLINED', providerRef, reason: 'Pagamento recusado (simulado)' };
    }
    if (this.outcome === 'pending') {
      const pixCode = input.method === 'PIX' ? `00020126SIMULADO${input.orderNumber}` : undefined;
      return { status: 'PENDING', providerRef, pixCode };
    }
    return { status: 'APPROVED', providerRef };
  }

  async refund(): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
