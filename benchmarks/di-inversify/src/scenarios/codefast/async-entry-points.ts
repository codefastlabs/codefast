/**
 * `@codefast/di` — the two public resolve entry points with no row of their own (codefast-only).
 *
 * Four of the six are measured elsewhere (`resolve`, `resolveAsync`, `resolveOptional`,
 * `resolveAll`). These are the remaining pair, and neither is a spelling of a measured one:
 * `resolveAllAsync` fans a whole candidate set into one cascade, and `resolveOptionalAsync` is the
 * async lane's miss — the one shape that reaches a caller without ever instantiating anything.
 */
import { Container, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

const ASYNC_STRATEGY_COUNT = 8;

const RESOLVE_ALL_ASYNC = {
  id: "resolve-all-async-8",
  group: "async",
  what: `resolveAllAsync() across ${String(ASYNC_STRATEGY_COUNT)} async factory bindings on one token (codefast-only)`,
} as const satisfies ScenarioDescriptor;

const RESOLVE_OPTIONAL_ASYNC_MISS = {
  id: "resolve-optional-async-miss",
  group: "async",
  what: "resolveOptionalAsync() when no binding exists — the async miss, resolved without instantiating (codefast-only)",
} as const satisfies ScenarioDescriptor;

function buildResolveAllAsyncScenario(): AsyncBenchScenario {
  const strategyToken = token<number>("bench-cf-async-resolve-all-strategy");
  const container = Container.create();

  // Predicate-only registrations, the same multi-binding shape the sync `resolve-all-*` rows use:
  // the default slot is last-wins, so N unqualified bindings would collapse to one.
  for (let index = 0; index < ASYNC_STRATEGY_COUNT; index++) {
    container
      .bind(strategyToken)
      .toDynamicAsync(async () => {
        await Promise.resolve();

        return index;
      })
      .when(() => true)
      .transient();
  }

  const expectedTotal = ((ASYNC_STRATEGY_COUNT - 1) * ASYNC_STRATEGY_COUNT) / 2;

  return {
    ...RESOLVE_ALL_ASYNC,
    kind: "async",
    batch: 1,
    sanity: async () => {
      const values = await container.resolveAllAsync(strategyToken);

      return (
        values.length === ASYNC_STRATEGY_COUNT && values.reduce((total, value) => total + value, 0) === expectedTotal
      );
    },
    build: () => {
      return async () => {
        const values = await container.resolveAllAsync(strategyToken);

        if (values.length !== ASYNC_STRATEGY_COUNT) {
          throw new Error(
            `Expected ${String(ASYNC_STRATEGY_COUNT)} async strategies, received ${String(values.length)}`,
          );
        }
      };
    },
  };
}

function buildResolveOptionalAsyncMissScenario(): AsyncBenchScenario {
  const missingToken = token<number>("bench-cf-async-optional-missing");
  const boundToken = token<number>("bench-cf-async-optional-bound");
  const container = Container.create();

  container.bind(boundToken).toConstantValue(1);

  return {
    ...RESOLVE_OPTIONAL_ASYNC_MISS,
    kind: "async",
    batch: 1,
    // A miss over a populated registry, not over an empty one: an empty container answers a
    // different question, and the row's name would then overstate what it covers.
    sanity: async () =>
      (await container.resolveOptionalAsync(missingToken)) === undefined &&
      (await container.resolveOptionalAsync(boundToken)) === 1,
    build: () => {
      return async () => {
        const value = await container.resolveOptionalAsync(missingToken);

        if (value !== undefined) {
          throw new Error(`Expected the unbound token to resolve to undefined, received ${String(value)}`);
        }
      };
    },
  };
}

export function buildCodefastAsyncEntryPointScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildResolveAllAsyncScenario(), buildResolveOptionalAsyncMissScenario()];
}
