import { TestBed, UndeclaredDependencyError } from "@codefast/di-testing";
import { expect, it } from "vitest";

import {
  InventoryToken,
  LoggerToken,
  OrderService,
  PaymentGatewayToken,
  PriceCatalogToken,
  RequestContextToken,
  ShopConfigToken,
} from "./shop";

it("reserves the stock before charging", () => {
  const { unit, mocks } = TestBed.solitary(OrderService).compile();

  unit.place("SKU-42");

  expect(mocks.get(InventoryToken).reserve.mock.calls[0]).toEqual(["SKU-42"]);
});

it("charges the catalog's price and returns the receipt", () => {
  const { unit, mocks } = TestBed.solitary(OrderService)
    .mock(PriceCatalogToken)
    .stub((fn) => ({ priceOf: fn().mockReturnValue({ amount: 42, currency: "USD" }) }))
    .mock(PaymentGatewayToken)
    .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
    .compile();

  expect(unit.place("SKU-42")).toBe("pay-1");
  expect(mocks.get(PaymentGatewayToken).charge.mock.calls[0]).toEqual([{ amount: 42, currency: "USD" }]);
});

it("logs the order under its request id", () => {
  const { unit, mocks } = TestBed.solitary(OrderService)
    .mock(RequestContextToken)
    .using({ instance: 1, requestId: "req-7" })
    .mock(PaymentGatewayToken)
    .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
    .compile();

  unit.place("SKU-42");

  expect(mocks.get(LoggerToken).info.mock.calls[0]).toEqual(["req-7: SKU-42 → pay-1"]);
});

it("refuses a token the unit never declared", () => {
  expect(() => TestBed.solitary(OrderService).mock(ShopConfigToken).using({ currency: "EUR" }).compile()).toThrow(
    UndeclaredDependencyError,
  );
});
