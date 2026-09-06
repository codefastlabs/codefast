import { injectable, token } from "@codefast/di";
import { TestBed } from "@codefast/di-testing";
import { expect, it } from "vitest";

interface PaymentGateway {
  charge(userId: string, amount: number): void;
}

const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");

@injectable([PaymentGatewayToken])
class OrderProcessor {
  constructor(private readonly payments: PaymentGateway) {}

  placeOrder(userId: string, amount: number): void {
    this.payments.charge(userId, amount);
  }
}

it("charges the gateway", () => {
  const { unit, mocks } = TestBed.solitary(OrderProcessor).compile();

  unit.placeOrder("u1", 42);

  expect(mocks.get(PaymentGatewayToken).charge.mock.calls[0]).toEqual(["u1", 42]);
});
