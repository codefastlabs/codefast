/**
 * `resolve-all-strategies-*` fan-out: measures `resolveAll()` on N `toConstantValue`
 * registrations for the same service id, **without** a name or tag (no disambiguation
 * qualifier in the hot path for `getAll` on the Inversify side).
 *
 * Inversify: N plain `.bind(TOKEN).toConstantValue(i)` on the same identifier; `getAll`
 * returns all N.
 *
 * @codefast/di: the default (unnamed) slot is **last-wins**, so you cannot model N
 * unqualified `toConstantValue` the same way as Inversify without a different
 * multi-registration strategy. We use the library’s **constraint-only** slot (`.when(() => true)`)
 * so each of the N `toConstantValue` lines remains a distinct multi-binding — same as the
 * multi-bind shape Inversify uses for this benchmark; there is no `whenNamed` walk.
 * See @codefast/di SPEC.md §4.8 (“constraint-based bindings as multi registrations”).
 */
import { Container, token } from "@codefast/di";
import {
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllStrategyCount,
} from "#/fixtures/fan-out-descriptor";
import type { BenchScenario } from "#/scenarios/types";

/**
 * Inversify: multiple plain binds to the same `Symbol` (no `whenNamed`).
 * Codefast: N distinct predicate-only registrations so `resolveAll` still returns N
 * values (parities Inversify `getAll` for this test).
 */
function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = token<number>("bench-cf-fanout-resolve-all-strategy");
  const container = Container.create();
  for (let index = 0; index < strategyCount; index++) {
    container
      .bind(strategyToken)
      .toConstantValue(index)
      .when(() => true);
  }
  const prewarmedStrategies = container.resolveAll(strategyToken);

  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    group: "fan-out",
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = container.resolveAll(strategyToken);
        if (strategies.length !== strategyCount) {
          throw new Error(
            `Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`,
          );
        }
      };
    },
  };
}

export function buildCodefastResolveAllStrategiesScenarios(): readonly BenchScenario[] {
  return RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
    buildResolveAllStrategiesScenario(strategyCount),
  );
}
