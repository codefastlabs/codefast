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
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";

/** One test's outcome: its name as the sample states it, whether it passed, and the value it checked. */
export interface ShopTestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly evidence: string;
}

interface ShopTest {
  readonly run: () => Omit<ShopTestResult, "name">;
}

function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

// One entry per `it(...)` of the sample, in file order; the titles come from the shared list the card also reads.
const TESTS: ReadonlyArray<ShopTest> = [
  {
    run: () => {
      const { unit, mocks } = TestBed.solitary(OrderService).compile();

      unit.place("SKU-42");

      const call = mocks.get(InventoryToken).reserve.mock.calls[0];

      return { passed: same(call, ["SKU-42"]), evidence: `reserve.mock.calls[0] = ${JSON.stringify(call)}` };
    },
  },
  {
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
  return TESTS.map(({ run }, index) => {
    const name = SHOP_TESTS[index]?.title ?? `test ${index + 1}`;

    try {
      return { name, ...run() };
    } catch (error: unknown) {
      return { name, passed: false, evidence: error instanceof Error ? error.message : String(error) };
    }
  });
}
