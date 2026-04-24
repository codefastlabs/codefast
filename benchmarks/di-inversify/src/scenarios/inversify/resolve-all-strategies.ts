/**
 * `resolve-all-strategies-*` fan-out: measures `getAll()` (Inversify) on N
 * `toConstantValue` bindings to the same service id — **no** `whenNamed` / tag
 * qualifiers. Parallels codefast’s `resolveAll` on the same N-fold multi-binding
 * (see the comment in the codefast `resolve-all-strategies.ts` module for how
 * @codefast/di’s default last-wins slot is bridged to N retained registrations).
 */
import { Container } from "inversify";
import {
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllStrategyCount,
} from "#/fixtures/fan-out-descriptor";
import type { BenchScenario } from "#/scenarios/types";

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyIdentifier = Symbol("bench-inv-fanout-resolve-all-strategy");
  const container = new Container();
  for (let index = 0; index < strategyCount; index++) {
    container.bind<number>(strategyIdentifier).toConstantValue(index);
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

export function buildInversifyResolveAllStrategiesScenarios(): readonly BenchScenario[] {
  return RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
    buildResolveAllStrategiesScenario(strategyCount),
  );
}
