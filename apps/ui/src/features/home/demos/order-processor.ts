/** The unit under test in the home page's runnable test bed, matching the sample shown beside it. */
import { injectable, token } from "@codefast/di";

export interface PaymentGateway {
  charge(userId: string, amount: number): void;
}

export const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");

@injectable([PaymentGatewayToken])
export class OrderProcessor {
  constructor(private readonly payments: PaymentGateway) {}

  placeOrder(userId: string, amount: number): void {
    this.payments.charge(userId, amount);
  }
}
