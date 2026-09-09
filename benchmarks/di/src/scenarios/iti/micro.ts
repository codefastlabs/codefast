/**
 * iti — micro-benchmarks. Parallel structure to `../codefast/micro.ts` for the
 * rows iti can express: identical `id`s, identical `batch` factors, identical
 * pre-warm strategy. iti bindings are memoized singletons, so the transient
 * micro row has no honest iti equivalent and is omitted.
 */
import { createContainer } from "iti";

import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  SINGLETON_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

class MicroLeafDependency {}

class MicroServiceWithOneDependency {
  constructor(readonly leafDependency: MicroLeafDependency) {}
}

function buildConstantResolveScenario(): BenchScenario {
  const container = createContainer().add({ constant: 42 });
  container.get("constant");

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.get("constant") === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.get("constant");
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = createContainer()
    .add({ leaf: () => new MicroLeafDependency() })
    .add((items) => ({ svc: () => new MicroServiceWithOneDependency(items.leaf) }));
  const initialResolution = container.get("svc");

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => container.get("svc").leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get("svc");
      }),
  };
}

/**
 * Builds the iti micro-benchmark scenarios iti can express.
 */
export function buildItiMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [buildConstantResolveScenario(), buildSingletonClassOneDepScenario()];
}
