/**
 * injection-js — micro-benchmarks. Parallel structure to `../codefast/micro.ts`
 * for the rows injection-js can express: identical `id`s, identical `batch`
 * factors, identical pre-warm strategy. `ReflectiveInjector` caches every `get`,
 * so the transient micro row has no honest equivalent and is omitted; the
 * singleton class is wired through `@Injectable` constructor metadata.
 */
import "reflect-metadata";
import { Inject, Injectable, InjectionToken, ReflectiveInjector } from "injection-js";

import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  SINGLETON_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

@Injectable()
class MicroLeafDependency {}

@Injectable()
class MicroServiceWithOneDependency {
  constructor(
    // @ts-ignore esbuild emits no design:paramtypes, so the token is named explicitly
    @Inject(MicroLeafDependency)
    readonly leafDependency: MicroLeafDependency,
  ) {}
}

const MICRO_CONSTANT_TOKEN = new InjectionToken<number>("bench-injection-js-micro-constant");

function buildConstantResolveScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([{ provide: MICRO_CONSTANT_TOKEN, useValue: 42 }]);
  injector.get(MICRO_CONSTANT_TOKEN);

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => injector.get(MICRO_CONSTANT_TOKEN) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        injector.get(MICRO_CONSTANT_TOKEN);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([MicroLeafDependency, MicroServiceWithOneDependency]);
  const initialResolution = injector.get(MicroServiceWithOneDependency);

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => injector.get(MicroServiceWithOneDependency).leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        injector.get(MicroServiceWithOneDependency);
      }),
  };
}

/**
 * Builds the injection-js micro-benchmark scenarios it can express.
 */
export function buildInjectionJsMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [buildConstantResolveScenario(), buildSingletonClassOneDepScenario()];
}
