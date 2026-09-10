/**
 * Brandi — micro-benchmarks. Parallel structure to `../codefast/micro.ts`:
 * identical `id`s, identical `batch` factors, identical pre-warm strategy.
 * Brandi is token-based; classes declare their dependency tokens through
 * `injected()` and resolve in singleton or transient scope.
 */
import { createContainer, injected, token } from "brandi";

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

const MICRO_CONSTANT_TOKEN = token<number>("bench-brandi-micro-constant");
const MICRO_LEAF_TOKEN = token<MicroLeafDependency>("bench-brandi-micro-leaf");
const MICRO_SERVICE_TOKEN = token<MicroServiceWithOneDependency>("bench-brandi-micro-svc");

injected(MicroServiceWithOneDependency, MICRO_LEAF_TOKEN);

function buildConstantResolveScenario(): BenchScenario {
  const container = createContainer();
  container.bind(MICRO_CONSTANT_TOKEN).toConstant(42);
  container.get(MICRO_CONSTANT_TOKEN);

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.get(MICRO_CONSTANT_TOKEN) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.get(MICRO_CONSTANT_TOKEN);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = createContainer();
  container.bind(MICRO_LEAF_TOKEN).toInstance(MicroLeafDependency).inSingletonScope();
  container.bind(MICRO_SERVICE_TOKEN).toInstance(MicroServiceWithOneDependency).inSingletonScope();
  const initialResolution = container.get(MICRO_SERVICE_TOKEN);

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => container.get(MICRO_SERVICE_TOKEN).leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(MICRO_SERVICE_TOKEN);
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = createContainer();
  container.bind(MICRO_LEAF_TOKEN).toInstance(MicroLeafDependency).inTransientScope();
  container.bind(MICRO_SERVICE_TOKEN).toInstance(MicroServiceWithOneDependency).inTransientScope();
  container.get(MICRO_SERVICE_TOKEN);

  return {
    ...TRANSIENT_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.get(MICRO_SERVICE_TOKEN);
      const secondResolution = container.get(MICRO_SERVICE_TOKEN);
      return firstResolution !== secondResolution && firstResolution.leafDependency !== secondResolution.leafDependency;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(MICRO_SERVICE_TOKEN);
      }),
  };
}

/**
 * Builds the brandi micro-benchmark scenarios.
 */
class OptionalMissLeaf {}

class OptionalMissService {
  constructor(readonly leafDependency?: OptionalMissLeaf) {}
}

const OPTIONAL_MISS_LEAF_TOKEN = token<OptionalMissLeaf>("bench-brandi-optional-miss-leaf");
const OPTIONAL_MISS_SERVICE_TOKEN = token<OptionalMissService>("bench-brandi-optional-miss-svc");

injected(OptionalMissService, OPTIONAL_MISS_LEAF_TOKEN.optional);

function buildOptionalMissingTransientScenario(): BenchScenario {
  const container = createContainer();
  // The optional leaf token is never bound, so every resolve checks the absent optional.
  container.bind(OPTIONAL_MISS_SERVICE_TOKEN).toInstance(OptionalMissService).inTransientScope();
  container.get(OPTIONAL_MISS_SERVICE_TOKEN);

  return {
    ...OPTIONAL_MISSING_TRANSIENT,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.get(OPTIONAL_MISS_SERVICE_TOKEN);
      const secondResolution = container.get(OPTIONAL_MISS_SERVICE_TOKEN);
      return firstResolution !== secondResolution && firstResolution.leafDependency === undefined;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(OPTIONAL_MISS_SERVICE_TOKEN);
      }),
  };
}

export function buildBrandiMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildConstantResolveScenario(),
    buildSingletonClassOneDepScenario(),
    buildTransientClassOneDepScenario(),
    buildOptionalMissingTransientScenario(),
  ];
}
