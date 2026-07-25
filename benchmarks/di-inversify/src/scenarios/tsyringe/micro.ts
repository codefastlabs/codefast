/**
 * tsyringe — micro-benchmarks. Parallel structure to
 * {@link ../codefast/micro.ts}: identical `id`s, identical `batch` factors,
 * identical pre-warm strategy. Each scenario resolves from a fresh child
 * container so registrations never leak into the shared root container.
 */
import "reflect-metadata";
import { container as rootContainer, inject, injectable, Lifecycle } from "tsyringe";

import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  SINGLETON_CLASS_1_DEP,
  TRANSIENT_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const MICRO_LEAF_TOKEN = Symbol("bench-tsyringe-micro-leaf");
const MICRO_CONSTANT_TOKEN = Symbol("bench-tsyringe-micro-constant");
const MICRO_SERVICE_TOKEN = Symbol("bench-tsyringe-micro-svc");

@injectable()
class MicroLeafDependency {}

@injectable()
class MicroServiceWithOneDependency {
  constructor(
    // @ts-ignore reflect-metadata picks this up at decorator eval time
    @inject(MICRO_LEAF_TOKEN)
    readonly leafDependency: MicroLeafDependency,
  ) {}
}

function buildConstantResolveScenario(): BenchScenario {
  const container = rootContainer.createChildContainer();
  container.register<number>(MICRO_CONSTANT_TOKEN, { useValue: 42 });
  container.resolve<number>(MICRO_CONSTANT_TOKEN);

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.resolve<number>(MICRO_CONSTANT_TOKEN) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.resolve<number>(MICRO_CONSTANT_TOKEN);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = rootContainer.createChildContainer();
  container.register(MICRO_LEAF_TOKEN, { useClass: MicroLeafDependency }, { lifecycle: Lifecycle.Singleton });
  container.register(
    MICRO_SERVICE_TOKEN,
    { useClass: MicroServiceWithOneDependency },
    { lifecycle: Lifecycle.Singleton },
  );
  const initialResolution = container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN).leafDependency ===
      initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = rootContainer.createChildContainer();
  container.register(MICRO_LEAF_TOKEN, { useClass: MicroLeafDependency }, { lifecycle: Lifecycle.Transient });
  container.register(
    MICRO_SERVICE_TOKEN,
    { useClass: MicroServiceWithOneDependency },
    { lifecycle: Lifecycle.Transient },
  );
  container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);

  return {
    ...TRANSIENT_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);
      const secondResolution = container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);
      return firstResolution !== secondResolution && firstResolution.leafDependency !== secondResolution.leafDependency;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve<MicroServiceWithOneDependency>(MICRO_SERVICE_TOKEN);
      }),
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildTsyringeMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [buildConstantResolveScenario(), buildSingletonClassOneDepScenario(), buildTransientClassOneDepScenario()];
}
