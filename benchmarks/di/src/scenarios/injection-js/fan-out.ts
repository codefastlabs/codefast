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
import { isCompleteCollection } from "#/fixtures/sanity";
import { resolveAllColdDescriptor, resolveAllStrategiesDescriptor } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = new InjectionToken<ReadonlyArray<number>>("bench-injection-js-fanout-resolve-all-strategy");
  const providers: Array<ValueProvider> = [];
  for (let index = 0; index < strategyCount; index++) {
    providers.push({ provide: strategyToken, useValue: index, multi: true });
  }
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  injector.get(strategyToken);

  return {
    ...resolveAllStrategiesDescriptor(strategyCount),
    // injection-js caches the multi:true provider array — get() hands back the same array.
    what: `get() a cached multi:true array across ${String(strategyCount)} bindings once`,
    batch: 1,
    sanity: () => isCompleteCollection(injector.get(strategyToken), strategyCount),
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

function buildResolveAllColdScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = new InjectionToken<ReadonlyArray<number>>("bench-injection-js-fanout-resolve-all-cold");
  const providers: Array<ValueProvider> = [];
  for (let index = 0; index < strategyCount; index++) {
    providers.push({ provide: strategyToken, useValue: index, multi: true });
  }
  function buildAndRead(): ReadonlyArray<number> {
    return ReflectiveInjector.resolveAndCreate(providers).get(strategyToken);
  }
  const buildAndReadOnce = (): number => buildAndRead().length;
  buildAndReadOnce();

  return {
    ...resolveAllColdDescriptor(strategyCount),
    // The multi:true array is built here for the first time, so this row charges the memoisation.
    what: `resolveAndCreate() a fresh injector over ${String(strategyCount)} multi:true providers, get() the array once (cold collection)`,
    batch: 1,
    sanity: () => isCompleteCollection(buildAndRead(), strategyCount),
    build: () => {
      return () => {
        if (buildAndReadOnce() !== strategyCount) {
          throw new Error(`Expected ${String(strategyCount)} strategies from a cold injector`);
        }
      };
    },
  };
}

/**
 * Builds the injection-js fan-out scenarios.
 */
export function buildInjectionJsFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllStrategiesScenario(strategyCount)),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllColdScenario(strategyCount)),
  ];
}
