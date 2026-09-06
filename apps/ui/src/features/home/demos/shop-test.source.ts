import { TestBed } from "@codefast/di-testing";
import { expect, it } from "vitest";

import { InventoryToken, OrderService } from "./shop";

it("reserves the stock before charging", () => {
  const { unit, mocks } = TestBed.solitary(OrderService).compile();

  unit.place("SKU-42");

  expect(mocks.get(InventoryToken).reserve.mock.calls[0]).toEqual(["SKU-42"]);
});
