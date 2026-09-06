/** The testing section's sample, runnable in this process: the same beds, plain checks, one line of evidence each. */
import { TestBed, UndeclaredDependencyError } from "@codefast/di-testing";

import {
  InventoryToken,
  LoggerToken,
  OrderService,
  PaymentGatewayToken,
  PriceCatalogToken,
  RequestContextToken,
  ShopConfigToken,
} from "#/features/home/demos/shop";

/** One test's outcome: its name as the sample states it, whether it passed, and the value it checked. */
export interface ShopTestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly evidence: string;
}

interface ShopTest {
  readonly name: string;
  readonly run: () => Omit<ShopTestResult, "name">;
}

function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

// The names are the sample's `it(...)` titles, verbatim, so the panel reports the tests the reader is looking at.
const TESTS: ReadonlyArray<ShopTest> = [
  {
    name: "reserves the stock before charging",
    run: () => {
      const { unit, mocks } = TestBed.solitary(OrderService).compile();

      unit.place("SKU-42");

      const call = mocks.get(InventoryToken).reserve.mock.calls[0];

      return { passed: same(call, ["SKU-42"]), evidence: `reserve.mock.calls[0] = ${JSON.stringify(call)}` };
    },
  },
  {
    name: "charges the catalog's price and returns the receipt",
    run: () => {
      const { unit, mocks } = TestBed.solitary(OrderService)
        .mock(PriceCatalogToken)
        .stub((fn) => ({ priceOf: fn().mockReturnValue({ amount: 42, currency: "USD" }) }))
        .mock(PaymentGatewayToken)
        .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
        .compile();
      const receipt = unit.place("SKU-42");
      const call = mocks.get(PaymentGatewayToken).charge.mock.calls[0];

      return {
        passed: receipt === "pay-1" && same(call, [{ amount: 42, currency: "USD" }]),
        evidence: `place("SKU-42") = ${JSON.stringify(receipt)}, charge.mock.calls[0] = ${JSON.stringify(call)}`,
      };
    },
  },
  {
    name: "logs the order under its request id",
    run: () => {
      const { unit, mocks } = TestBed.solitary(OrderService)
        .mock(RequestContextToken)
        .using({ instance: 1, requestId: "req-7" })
        .mock(PaymentGatewayToken)
        .stub((fn) => ({ charge: fn().mockReturnValue("pay-1") }))
        .compile();

      unit.place("SKU-42");

      const call = mocks.get(LoggerToken).info.mock.calls[0];

      return {
        passed: same(call, ["req-7: SKU-42 → pay-1"]),
        evidence: `info.mock.calls[0] = ${JSON.stringify(call)}`,
      };
    },
  },
  {
    name: "refuses a token the unit never declared",
    run: () => {
      try {
        TestBed.solitary(OrderService).mock(ShopConfigToken).using({ currency: "EUR" }).compile();

        return { passed: false, evidence: "compile() accepted ShopConfigToken" };
      } catch (error: unknown) {
        const refused = error instanceof UndeclaredDependencyError;

        return {
          passed: refused,
          evidence: refused ? `compile() threw ${error.code}` : String(error),
        };
      }
    },
  },
];

/** Runs every test of the sample and reports each outcome; a thrown check is a failure, never a crash. */
export function runShopTests(): ReadonlyArray<ShopTestResult> {
  return TESTS.map(({ name, run }) => {
    try {
      return { name, ...run() };
    } catch (error: unknown) {
      return { name, passed: false, evidence: error instanceof Error ? error.message : String(error) };
    }
  });
}
