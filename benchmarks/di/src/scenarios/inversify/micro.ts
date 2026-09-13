/**
 * InversifyJS 8 — micro-benchmarks. Parallel structure to
 * `../codefast/micro.ts`: identical `id`s, identical `batch` factors,
 * identical pre-warm strategy. The two modules differ only in which
 * library they call — that is the whole point of the side-by-side report.
 */
import "reflect-metadata";
import { Container, inject, injectable, optional } from "inversify";

import { isFreshEachResolve } from "#/fixtures/sanity";
import {
  CLASS_RESOLVE_BATCH,
  CONSTANT_RESOLVE,
  CONSTANT_RESOLVE_BATCH,
  NAMED_CONSTANT_GET,
  NAMED_RESOLVE_BATCH,
  namedResolveSlotsDescriptor,
  OPTIONAL_MISSING_TRANSIENT,
  SLOT_COUNTS,
  SINGLETON_CLASS_1_DEP,
  TRANSIENT_CLASS_1_DEP,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const microLeafDependencyIdentifier = Symbol("bench-inv-micro-leaf");
const microServiceWithOneDependencyIdentifier = Symbol("bench-inv-micro-svc");

@injectable()
class MicroLeafDependency {}

@injectable()
class MicroServiceWithOneDependency {
  constructor(
    // @ts-ignore reflect-metadata picks this up at decorator eval time
    @inject(microLeafDependencyIdentifier)
    readonly leafDependency: MicroLeafDependency,
  ) {}
}

function buildConstantResolveScenario(): BenchScenario {
  const constantValueBindingIdentifier = Symbol("bench-inv-micro-constant");
  const container = new Container({ jitless: false });
  container.bind<number>(constantValueBindingIdentifier).toConstantValue(42);
  container.get(constantValueBindingIdentifier);

  return {
    ...CONSTANT_RESOLVE,
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.get<number>(constantValueBindingIdentifier) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.get(constantValueBindingIdentifier);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<MicroLeafDependency>(microLeafDependencyIdentifier).to(MicroLeafDependency).inSingletonScope();
  container
    .bind<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier)
    .to(MicroServiceWithOneDependency)
    .inSingletonScope();
  const initialResolution = container.get<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier);

  return {
    ...SINGLETON_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      container.get<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier).leafDependency ===
      initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(microServiceWithOneDependencyIdentifier);
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<MicroLeafDependency>(microLeafDependencyIdentifier).to(MicroLeafDependency).inTransientScope();
  container
    .bind<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier)
    .to(MicroServiceWithOneDependency)
    .inTransientScope();
  container.get(microServiceWithOneDependencyIdentifier);

  return {
    ...TRANSIENT_CLASS_1_DEP,
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      isFreshEachResolve(
        () => container.get<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier),
        (service) => service.leafDependency,
      ),
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(microServiceWithOneDependencyIdentifier);
      }),
  };
}

function buildNamedConstantGetScenario(): BenchScenario {
  const wideNamedBindingIdentifier = Symbol("bench-inv-micro-named");
  const container = new Container({ jitless: false });
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(5).whenNamed("slot-5");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(12).whenNamed("slot-12");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(20).whenNamed("slot-20");
  container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" });

  return {
    ...NAMED_CONSTANT_GET,
    batch: NAMED_RESOLVE_BATCH,
    sanity: () => container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" }) === 12,
    build: () =>
      batched(NAMED_RESOLVE_BATCH, () => {
        container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" });
      }),
  };
}

const optionalMissLeafIdentifier = Symbol("bench-inv-micro-optional-miss-leaf");
const optionalMissServiceIdentifier = Symbol("bench-inv-micro-optional-miss-service");

@injectable()
class OptionalMissService {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(optionalMissLeafIdentifier)
    // @ts-ignore reflect-metadata + explicit token injection
    @optional()
    readonly leafDependency: MicroLeafDependency | undefined,
  ) {}
}

function buildOptionalMissingTransientScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  // The optional leaf identifier is never bound, so every get checks the absent optional.
  container.bind<OptionalMissService>(optionalMissServiceIdentifier).to(OptionalMissService).inTransientScope();
  container.get(optionalMissServiceIdentifier);

  return {
    ...OPTIONAL_MISSING_TRANSIENT,
    what: "get() a transient class whose one @optional dependency is unbound",
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const first = container.get<OptionalMissService>(optionalMissServiceIdentifier);
      const second = container.get<OptionalMissService>(optionalMissServiceIdentifier);
      return first !== second && first.leafDependency === undefined;
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(optionalMissServiceIdentifier);
      }),
  };
}

// The named-selection axis: the last-bound name is the target, the far end of any linear scan.
function buildNamedResolveSlotsScenario(count: number): BenchScenario {
  const slotsIdentifier = Symbol(`bench-inv-micro-named-slots-${String(count)}`);
  const container = new Container({ jitless: false });
  for (let index = 0; index < count; index++) {
    container
      .bind<number>(slotsIdentifier)
      .toConstantValue(index)
      .whenNamed(`slot-${String(index)}`);
  }
  const target = { name: `slot-${String(count - 1)}` } as const;
  container.get<number>(slotsIdentifier, target);

  return {
    ...namedResolveSlotsDescriptor(count),
    what: `get() one named constant out of ${String(count)} whenNamed() bindings on one identifier`,
    batch: NAMED_RESOLVE_BATCH,
    sanity: () => container.get<number>(slotsIdentifier, target) === count - 1,
    build: () =>
      batched(NAMED_RESOLVE_BATCH, () => {
        container.get<number>(slotsIdentifier, target);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyMicroScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildConstantResolveScenario(),
    buildSingletonClassOneDepScenario(),
    buildTransientClassOneDepScenario(),
    buildNamedConstantGetScenario(),
    buildOptionalMissingTransientScenario(),
    ...SLOT_COUNTS.map((count) => buildNamedResolveSlotsScenario(count)),
  ];
}
