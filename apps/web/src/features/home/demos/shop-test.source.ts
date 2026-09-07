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

  const inventory = mocks.get(InventoryToken);

  expect(inventory.reserve.mock.calls[0]).toEqual(["SKU-42"]);
});

it("charges the catalog's price and returns the receipt", () => {
  const price = { amount: 42, currency: "USD" };
  const { unit, mocks } = TestBed.solitary(OrderService)
    .mock(PriceCatalogToken)
    .stub((fn) => ({ priceOf: fn().mockReturnValue(price) }))
    .mock(PaymentGatewayToken)
    .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
    .compile();

  expect(unit.place("SKU-42")).toBe("pay-1");

  const gateway = mocks.get(PaymentGatewayToken);

  expect(gateway.charge.mock.calls[0]).toEqual([price]);
});

it("logs the order under its request id", () => {
  const { unit, mocks } = TestBed.solitary(OrderService)
    .mock(RequestContextToken)
    .using({ instance: 1, requestId: "req-7" })
    .mock(PaymentGatewayToken)
    .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
    .compile();

  unit.place("SKU-42");

  const logger = mocks.get(LoggerToken);

  expect(logger.info.mock.calls[0]).toEqual(["req-7: SKU-42 → pay-1"]);
});

it("refuses a token the unit never declared", () => {
  const bed = TestBed.solitary(OrderService).mock(ShopConfigToken);
  const compile = () => bed.using({ currency: "EUR" }).compile();

  expect(compile).toThrow(UndeclaredDependencyError);
});
