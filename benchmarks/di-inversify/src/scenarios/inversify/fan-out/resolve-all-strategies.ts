/**
 * `resolve-all-strategies-*` fan-out: measures `getAll()` (Inversify) on N
 * `toConstantValue` bindings to the same service id — **no** `whenNamed` / tag
 * qualifiers. Parallels codefast’s `resolveAll` on the same N-fold multi-binding
 * (see the comment in the codefast `resolve-all-strategies.ts` module for how
 * @codefast/di’s default last-wins slot is bridged to N retained registrations).
 */
import { Container } from "inversify";
import {
  RESOLVE_ALL_NAMED_COUNTS,
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllNamedCount,
  type ResolveAllStrategyCount,
} from "#/fixtures/fan-out-descriptor";
import type { BenchScenario } from "#/scenarios/types";

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyIdentifier = Symbol("bench-inv-fanout-resolve-all-strategy");
  const container = new Container();
  for (let index = 0; index < strategyCount; index++) {
    container
      .bind<number>(strategyIdentifier)
      .toConstantValue(index)
      .when(() => true);
  }
  const prewarmedStrategies = container.getAll<number>(strategyIdentifier);

  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    group: "fan-out",
    what: `getAll() across ${String(strategyCount)} strategy bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = container.getAll<number>(strategyIdentifier);
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
  const strategyIdentifier = Symbol("bench-inv-fanout-resolve-all-named");
  const targetName = "strategy-0";
  const container = new Container();
  for (let index = 0; index < namedCount; index++) {
    container
      .bind<number>(strategyIdentifier)
      .toConstantValue(index)
      .whenNamed(`strategy-${String(index)}`);
  }
  const prewarmedStrategies = container.getAll<number>(strategyIdentifier, { name: targetName });

  return {
    id: `resolve-all-named-${String(namedCount)}`,
    group: "fan-out",
    what: `getAll() with name qualifier across ${String(namedCount)} named strategy bindings`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === 1 && prewarmedStrategies[0] === 0,
    build: () => {
      return () => {
        const strategies = container.getAll<number>(strategyIdentifier, { name: targetName });
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
export function buildInversifyResolveAllStrategiesScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
      buildResolveAllStrategiesScenario(strategyCount),
    ),
    ...RESOLVE_ALL_NAMED_COUNTS.map((namedCount) => buildResolveAllNamedScenario(namedCount)),
  ];
}
