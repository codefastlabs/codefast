/**
 * Awilix — micro-benchmarks. Parallel structure to
 * {@link ../codefast/micro.ts}: identical `id`s, identical `batch` factors,
 * identical pre-warm strategy. Awilix resolves by registration name with
 * the PROXY injection mode, so classes read their dependency off the cradle.
 */
import { asClass, asValue, createContainer, InjectionMode, Lifetime } from "awilix";

import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  SINGLETON_CLASS_1_DEP,
  TRANSIENT_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

class MicroLeafDependency {}

class MicroServiceWithOneDependency {
  readonly leafDependency: MicroLeafDependency;
  constructor(cradle: { leaf: MicroLeafDependency }) {
    this.leafDependency = cradle.leaf;
  }
}

function buildConstantResolveScenario(): BenchScenario {
  const container = createContainer({ injectionMode: InjectionMode.PROXY });
  container.register("constant", asValue(42));
  container.resolve<number>("constant");

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.resolve<number>("constant") === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.resolve("constant");
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = createContainer({ injectionMode: InjectionMode.PROXY });
  container.register("leaf", asClass(MicroLeafDependency, { lifetime: Lifetime.SINGLETON }));
  container.register("svc", asClass(MicroServiceWithOneDependency, { lifetime: Lifetime.SINGLETON }));
  const initialResolution = container.resolve<MicroServiceWithOneDependency>("svc");

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      container.resolve<MicroServiceWithOneDependency>("svc").leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve("svc");
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = createContainer({ injectionMode: InjectionMode.PROXY });
  container.register("leaf", asClass(MicroLeafDependency, { lifetime: Lifetime.TRANSIENT }));
  container.register("svc", asClass(MicroServiceWithOneDependency, { lifetime: Lifetime.TRANSIENT }));
  container.resolve("svc");

  return {
    ...TRANSIENT_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.resolve<MicroServiceWithOneDependency>("svc");
      const secondResolution = container.resolve<MicroServiceWithOneDependency>("svc");
      return firstResolution !== secondResolution && firstResolution.leafDependency !== secondResolution.leafDependency;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve("svc");
      }),
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildAwilixMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [buildConstantResolveScenario(), buildSingletonClassOneDepScenario(), buildTransientClassOneDepScenario()];
}
