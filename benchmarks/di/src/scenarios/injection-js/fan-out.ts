/**
 * injection-js — fan-out scenarios: the `resolveAll()` rows only.
 *
 * `resolve-all-strategies-*`: N `multi: true` value providers under one token, then
 * `get()` — which returns a **cached** array (the same reference every call), so this
 * row measures cached-collection retrieval. The transient fan-out tree has no honest
 * equivalent (`ReflectiveInjector` caches every `get`) and stays omitted.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";
import type { ValueProvider } from "injection-js";

import { RESOLVE_ALL_STRATEGY_COUNTS } from "#/fixtures/fan-out-descriptor";
import type { ResolveAllStrategyCount } from "#/fixtures/fan-out-descriptor";
import { resolveAllStrategiesDescriptor } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = new InjectionToken<ReadonlyArray<number>>("bench-injection-js-fanout-resolve-all-strategy");
  const providers: Array<ValueProvider> = [];
  for (let index = 0; index < strategyCount; index++) {
    providers.push({ provide: strategyToken, useValue: index, multi: true });
  }
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  const prewarmedStrategies = injector.get(strategyToken);

  return {
    ...resolveAllStrategiesDescriptor(strategyCount),
    // injection-js caches the multi:true provider array — get() hands back the same array.
    what: `get() a cached multi:true array across ${String(strategyCount)} bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = injector.get(strategyToken);
        if (strategies.length !== strategyCount) {
          throw new Error(`Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`);
        }
      };
    },
  };
}

/**
 * Builds the injection-js fan-out scenarios.
 */
export function buildInjectionJsFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllStrategiesScenario(strategyCount));
}
