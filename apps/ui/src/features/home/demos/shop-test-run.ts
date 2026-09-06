/** The testing section's sample, runnable in this process: the same beds, plain checks, and what each one observed. */
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

/** One value a test looked at: the expression the sample reads and what it held, both as the reader would write them. */
export interface Observation {
  readonly expression: string;
  readonly value: string;
}

/** One test's outcome: its name as the sample states it, whether it passed, and what it observed on the way. */
export interface ShopTestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly observations: ReadonlyArray<Observation>;
}

interface ShopTest {
  readonly run: () => Omit<ShopTestResult, "name">;
}

function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

/** A value as the sample would write it: arrays and objects spaced like source, strings quoted, so lines wrap at spaces. */
function show(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(show).join(", ")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{ ${Object.entries(value)
      .map(([key, entry]) => `${key}: ${show(entry)}`)
      .join(", ")} }`;
  }

  return JSON.stringify(value) ?? String(value);
}

// One entry per `it(...)` of the sample, in file order; the titles come from the shared list the card also reads.
const TESTS: ReadonlyArray<ShopTest> = [
  {
    run: () => {
      const { unit, mocks } = TestBed.solitary(OrderService).compile();

      unit.place("SKU-42");

      const call = mocks.get(InventoryToken).reserve.mock.calls[0];

      return {
        passed: same(call, ["SKU-42"]),
        observations: [{ expression: "reserve.mock.calls[0]", value: show(call) }],
      };
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
        observations: [
          { expression: 'place("SKU-42")', value: show(receipt) },
          { expression: "charge.mock.calls[0]", value: show(call) },
        ],
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
        observations: [{ expression: "info.mock.calls[0]", value: show(call) }],
      };
    },
  },
  {
    run: () => {
      try {
        TestBed.solitary(OrderService).mock(ShopConfigToken).using({ currency: "EUR" }).compile();

        return { passed: false, observations: [{ expression: "compile()", value: "returned a bed" }] };
      } catch (error: unknown) {
        const refused = error instanceof UndeclaredDependencyError;

        return {
          passed: refused,
          observations: [{ expression: "compile()", value: refused ? `throws ${error.code}` : String(error) }],
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
      return {
        name,
        passed: false,
        observations: [{ expression: "run", value: error instanceof Error ? error.message : String(error) }],
      };
    }
  });
}
