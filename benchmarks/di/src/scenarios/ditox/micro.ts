/**
 * Ditox — micro-benchmarks. Parallel structure to `../codefast/micro.ts`:
 * identical `id`s, identical `batch` factors, identical pre-warm strategy.
 * Ditox is functional; classes are wired through `injectableClass()` and bound
 * as singleton or transient factories.
 */
import { createContainer, injectableClass, optional, token } from "ditox";

import { isFreshEachResolve } from "#/fixtures/sanity";
import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  OPTIONAL_MISSING_TRANSIENT,
  SINGLETON_CLASS_1_DEP,
  TRANSIENT_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

class MicroLeafDependency {}

class MicroServiceWithOneDependency {
  constructor(readonly leafDependency: MicroLeafDependency) {}
}

const MICRO_CONSTANT_TOKEN = token<number>("bench-ditox-micro-constant");
const MICRO_LEAF_TOKEN = token<MicroLeafDependency>("bench-ditox-micro-leaf");
const MICRO_SERVICE_TOKEN = token<MicroServiceWithOneDependency>("bench-ditox-micro-svc");

function buildConstantResolveScenario(): BenchScenario {
  const container = createContainer();
  container.bindValue(MICRO_CONSTANT_TOKEN, 42);
  container.resolve(MICRO_CONSTANT_TOKEN);

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.resolve(MICRO_CONSTANT_TOKEN) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.resolve(MICRO_CONSTANT_TOKEN);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = createContainer();
  container.bindFactory(MICRO_LEAF_TOKEN, injectableClass(MicroLeafDependency), { scope: "singleton" });
  container.bindFactory(MICRO_SERVICE_TOKEN, injectableClass(MicroServiceWithOneDependency, MICRO_LEAF_TOKEN), {
    scope: "singleton",
  });
  const initialResolution = container.resolve(MICRO_SERVICE_TOKEN);

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => container.resolve(MICRO_SERVICE_TOKEN).leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve(MICRO_SERVICE_TOKEN);
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = createContainer();
  container.bindFactory(MICRO_LEAF_TOKEN, injectableClass(MicroLeafDependency), { scope: "transient" });
  container.bindFactory(MICRO_SERVICE_TOKEN, injectableClass(MicroServiceWithOneDependency, MICRO_LEAF_TOKEN), {
    scope: "transient",
  });
  container.resolve(MICRO_SERVICE_TOKEN);

  return {
    ...TRANSIENT_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      isFreshEachResolve(
        () => container.resolve(MICRO_SERVICE_TOKEN),
        (service) => service.leafDependency,
      ),
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve(MICRO_SERVICE_TOKEN);
      }),
  };
}

/**
 * Builds the ditox micro-benchmark scenarios.
 */
class OptionalMissLeaf {}

class OptionalMissService {
  constructor(readonly leafDependency?: OptionalMissLeaf) {}
}

const OPTIONAL_MISS_LEAF_TOKEN = token<OptionalMissLeaf>("bench-ditox-optional-miss-leaf");
const OPTIONAL_MISS_SERVICE_TOKEN = token<OptionalMissService>("bench-ditox-optional-miss-svc");

function buildOptionalMissingTransientScenario(): BenchScenario {
  const container = createContainer();
  // The optional leaf token is never bound, so every resolve checks the absent optional.
  container.bindFactory(
    OPTIONAL_MISS_SERVICE_TOKEN,
    injectableClass(OptionalMissService, optional(OPTIONAL_MISS_LEAF_TOKEN)),
    { scope: "transient" },
  );
  container.resolve(OPTIONAL_MISS_SERVICE_TOKEN);

  return {
    ...OPTIONAL_MISSING_TRANSIENT,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.resolve(OPTIONAL_MISS_SERVICE_TOKEN);
      const secondResolution = container.resolve(OPTIONAL_MISS_SERVICE_TOKEN);
      return firstResolution !== secondResolution && firstResolution.leafDependency === undefined;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve(OPTIONAL_MISS_SERVICE_TOKEN);
      }),
  };
}

export function buildDitoxMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildConstantResolveScenario(),
    buildSingletonClassOneDepScenario(),
    buildTransientClassOneDepScenario(),
    buildOptionalMissingTransientScenario(),
  ];
}
