/**
 * InversifyJS 8 — micro-benchmarks. Parallel structure to
 * {@link ../codefast/micro.ts}: identical `id`s, identical `batch` factors,
 * identical pre-warm strategy. The two modules differ only in which
 * library they call — that is the whole point of the side-by-side report.
 */
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CONSTANT_RESOLVE_BATCH = 1000;
const CLASS_RESOLVE_BATCH = 200;
const NAMED_RESOLVE_BATCH = 500;

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
  const container = new Container();
  container.bind<number>(constantValueBindingIdentifier).toConstantValue(42);
  container.get(constantValueBindingIdentifier);

  return {
    id: "constant-resolve",
    group: "micro",
    what: "resolve a toConstantValue binding",
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.get<number>(constantValueBindingIdentifier) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.get(constantValueBindingIdentifier);
      }),
  };
}

function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = new Container();
  container
    .bind<MicroLeafDependency>(microLeafDependencyIdentifier)
    .to(MicroLeafDependency)
    .inSingletonScope();
  container
    .bind<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier)
    .to(MicroServiceWithOneDependency)
    .inSingletonScope();
  const initialResolution = container.get<MicroServiceWithOneDependency>(
    microServiceWithOneDependencyIdentifier,
  );

  return {
    id: "singleton-class-1-dep",
    group: "micro",
    what: "resolve a singleton class with one dependency (cache hit)",
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      container.get<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier)
        .leafDependency === initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(microServiceWithOneDependencyIdentifier);
      }),
  };
}

function buildTransientClassOneDepScenario(): BenchScenario {
  const container = new Container();
  container
    .bind<MicroLeafDependency>(microLeafDependencyIdentifier)
    .to(MicroLeafDependency)
    .inTransientScope();
  container
    .bind<MicroServiceWithOneDependency>(microServiceWithOneDependencyIdentifier)
    .to(MicroServiceWithOneDependency)
    .inTransientScope();
  container.get(microServiceWithOneDependencyIdentifier);

  return {
    id: "transient-class-1-dep",
    group: "micro",
    what: "resolve a transient class with one transient dep (fresh each call)",
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.get<MicroServiceWithOneDependency>(
        microServiceWithOneDependencyIdentifier,
      );
      const secondResolution = container.get<MicroServiceWithOneDependency>(
        microServiceWithOneDependencyIdentifier,
      );
      return (
        firstResolution !== secondResolution &&
        firstResolution.leafDependency !== secondResolution.leafDependency
      );
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.get(microServiceWithOneDependencyIdentifier);
      }),
  };
}

function buildNamedConstantGetScenario(): BenchScenario {
  const wideNamedBindingIdentifier = Symbol("bench-inv-micro-named");
  const container = new Container();
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(5).whenNamed("slot-5");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(12).whenNamed("slot-12");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(20).whenNamed("slot-20");
  container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" });

  return {
    id: "named-constant-get",
    group: "micro",
    what: "resolve a named constant from a 3-candidate set",
    batch: NAMED_RESOLVE_BATCH,
    sanity: () => container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" }) === 12,
    build: () =>
      batched(NAMED_RESOLVE_BATCH, () => {
        container.get<number>(wideNamedBindingIdentifier, { name: "slot-12" });
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
  ];
}
