/**
 * `resolve-all-strategies-*` fan-out: measures `resolveAll()` on N `toConstantValue`
 * registrations for the same service id, **without** a name or tag (no disambiguation
 * qualifier in the hot path for `getAll` on the Inversify side).
 *
 * Inversify: N `.bind(TOKEN).toConstantValue(i).when(() => true)` registrations on the
 * same identifier; `getAll` returns all N.
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
  RESOLVE_ALL_NAMED_COUNTS,
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllNamedCount,
  type ResolveAllStrategyCount,
} from "#/fixtures/fan-out-descriptor";
import type { BenchScenario } from "#/scenarios/types";

/**
 * Both libraries use predicate-only registrations (`when(() => true)`) so the
 * `resolveAll/getAll` rows exercise the same "constraint-filtered multi-binding"
 * shape instead of mixing constrained and unconstrained binding paths.
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

function buildResolveAllNamedScenario(namedCount: ResolveAllNamedCount): BenchScenario {
  const strategyToken = token<number>("bench-cf-fanout-resolve-all-named");
  const targetName = "strategy-0";
  const container = Container.create();
  for (let index = 0; index < namedCount; index++) {
    container
      .bind(strategyToken)
      .toConstantValue(index)
      .whenNamed(`strategy-${String(index)}`);
  }
  const prewarmedStrategies = container.resolveAll(strategyToken, { name: targetName });

  return {
    id: `resolve-all-named-${String(namedCount)}`,
    group: "fan-out",
    what: `resolveAll() with name qualifier across ${String(namedCount)} named strategy bindings`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === 1 && prewarmedStrategies[0] === 0,
    build: () => {
      return () => {
        const strategies = container.resolveAll(strategyToken, { name: targetName });
        if (strategies.length !== 1 || strategies[0] !== 0) {
          throw new Error(
            `Expected one named strategy 0, received ${String(strategies.length)} strategies`,
          );
        }
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastResolveAllStrategiesScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
      buildResolveAllStrategiesScenario(strategyCount),
    ),
    ...RESOLVE_ALL_NAMED_COUNTS.map((namedCount) => buildResolveAllNamedScenario(namedCount)),
  ];
}
