/**
 * InversifyJS v8 — mirror scenarios in `codefast-benches.ts`.
 * Run via: `pnpm exec tsx --tsconfig tsconfig.inversify.json src/inversify-benches.ts`
 */
import "reflect-metadata";

import { Container, ContainerModule, inject, injectable } from "inversify";
import { Bench } from "tinybench";

/** Default duration (keep in sync with codefast-benches.ts). Raise locally for stabler numbers. */
const BENCH_OPTIONS = {
  time: 450,
  iterations: 800,
  warmupTime: 60,
  warmupIterations: 60,
} as const;

/** Keep numeric knobs in sync with `codefast-benches.ts`. */
const WIDE_N = 48;
const CHAIN_DEEP = 16;
const ROTATE_N = 32;
const MODULE_BINDS = 20;
const CHILD_DEPTH = 8;

const constantValueBindingIdentifier = Symbol.for("bench-inv-constant");
const wideNamedBindingIdentifier = Symbol.for("bench-inv-wide");

@injectable()
class InvDep {}

const dependencyClassIdentifier = Symbol.for("bench-inv-dep-class");
const serviceClassIdentifier = Symbol.for("bench-inv-svc-class");

@injectable()
class InvService {
  // @ts-ignore
  constructor(@inject(dependencyClassIdentifier) readonly dep: InvDep) {}
}

function buildConstantBench(): () => void {
  const container = new Container();
  container.bind<number>(constantValueBindingIdentifier).toConstantValue(42);
  container.get(constantValueBindingIdentifier);
  return () => {
    container.get(constantValueBindingIdentifier);
  };
}

function buildSingletonClassBench(): () => void {
  const container = new Container();
  container.bind<InvDep>(dependencyClassIdentifier).to(InvDep).inSingletonScope();
  container.bind<InvService>(serviceClassIdentifier).to(InvService).inSingletonScope();
  container.get(serviceClassIdentifier);
  return () => {
    container.get(serviceClassIdentifier);
  };
}

function buildTransientClassBench(): () => void {
  const container = new Container();
  container.bind<InvDep>(dependencyClassIdentifier).to(InvDep).inTransientScope();
  container.bind<InvService>(serviceClassIdentifier).to(InvService).inTransientScope();
  return () => {
    container.get(serviceClassIdentifier);
  };
}

function buildNamedConstantBench(): () => void {
  const container = new Container();
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(5).whenNamed("slot-5");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(12).whenNamed("slot-12");
  container.bind<number>(wideNamedBindingIdentifier).toConstantValue(20).whenNamed("slot-20");
  container.get(wideNamedBindingIdentifier, { name: "slot-12" });
  return () => {
    container.get(wideNamedBindingIdentifier, { name: "slot-12" });
  };
}

const chainBindingIdentifierAtDepth0 = Symbol.for("inv-chain-0");
const chainBindingIdentifierAtDepth1 = Symbol.for("inv-chain-1");
const chainBindingIdentifierAtDepth2 = Symbol.for("inv-chain-2");
const chainBindingIdentifierAtDepth3 = Symbol.for("inv-chain-3");

function buildDynamicChain4Bench(): () => void {
  const container = new Container();
  container.bind<number>(chainBindingIdentifierAtDepth0).toConstantValue(0);
  container
    .bind<number>(chainBindingIdentifierAtDepth1)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(chainBindingIdentifierAtDepth0) + 1,
    )
    .inTransientScope();
  container
    .bind<number>(chainBindingIdentifierAtDepth2)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(chainBindingIdentifierAtDepth1) + 1,
    )
    .inTransientScope();
  container
    .bind<number>(chainBindingIdentifierAtDepth3)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(chainBindingIdentifierAtDepth2) + 1,
    )
    .inTransientScope();
  container.get(chainBindingIdentifierAtDepth3);
  return () => {
    container.get(chainBindingIdentifierAtDepth3);
  };
}

const deepChainBindingIdentifiers = Array.from({ length: CHAIN_DEEP }, (_, depthIndex) =>
  Symbol.for(`inv-deep-${depthIndex}`),
);

function buildDynamicTransientChain16Bench(): () => void {
  const container = new Container();
  container.bind<number>(deepChainBindingIdentifiers[0]!).toConstantValue(0);
  for (let chainDepthIndex = 1; chainDepthIndex < CHAIN_DEEP; chainDepthIndex++) {
    const previousDepthIdentifier = deepChainBindingIdentifiers[chainDepthIndex - 1]!;
    const currentDepthIdentifier = deepChainBindingIdentifiers[chainDepthIndex]!;
    container
      .bind<number>(currentDepthIdentifier)
      .toDynamicValue(
        (resolutionContext) => resolutionContext.get<number>(previousDepthIdentifier) + 1,
      )
      .inTransientScope();
  }
  const leafChainBindingIdentifier = deepChainBindingIdentifiers[CHAIN_DEEP - 1]!;
  container.get(leafChainBindingIdentifier);
  return () => {
    container.get(leafChainBindingIdentifier);
  };
}

const manyNamedSlotsBindingIdentifier = Symbol.for("bench-inv-wide-48");

function buildResolveAllNamed48Bench(): () => void {
  const container = new Container();
  for (let slotIndex = 0; slotIndex < WIDE_N; slotIndex++) {
    container
      .bind<number>(manyNamedSlotsBindingIdentifier)
      .toConstantValue(slotIndex)
      .whenNamed(`slot-${slotIndex}`);
  }
  container.getAll(manyNamedSlotsBindingIdentifier);
  return () => {
    container.getAll(manyNamedSlotsBindingIdentifier);
  };
}

const rotatingBindingIdentifiers = Array.from({ length: ROTATE_N }, (_, slotIndex) =>
  Symbol.for(`bench-inv-rot-${slotIndex}`),
);

function buildRotateConstants32Bench(): () => void {
  const container = new Container();
  for (let slotIndex = 0; slotIndex < ROTATE_N; slotIndex++) {
    container.bind<number>(rotatingBindingIdentifiers[slotIndex]!).toConstantValue(slotIndex);
  }
  let rotatingBindingIndex = 0;
  return () => {
    void container.get<number>(rotatingBindingIdentifiers[rotatingBindingIndex]!);
    rotatingBindingIndex = (rotatingBindingIndex + 1) % ROTATE_N;
  };
}

const childInheritanceLeafIdentifier = Symbol.for("bench-inv-child-leaf");

function buildChildInheritResolve8Bench(): () => void {
  const rootContainer = new Container();
  rootContainer.bind<number>(childInheritanceLeafIdentifier).toConstantValue(42);
  let deepestChildContainer: Container = rootContainer;
  for (let childDepthIndex = 0; childDepthIndex < CHILD_DEPTH; childDepthIndex++) {
    deepestChildContainer = new Container({ parent: deepestChildContainer });
  }
  deepestChildContainer.get(childInheritanceLeafIdentifier);
  return () => {
    deepestChildContainer.get(childInheritanceLeafIdentifier);
  };
}

const moduleBindingIdentifiers = Array.from({ length: MODULE_BINDS }, (_, bindingIndex) =>
  Symbol.for(`bench-inv-mod-t-${bindingIndex}`),
);

const twentyBindingContainerModule = new ContainerModule((moduleBindingOptions) => {
  for (let bindingIndex = 0; bindingIndex < MODULE_BINDS; bindingIndex++) {
    moduleBindingOptions
      .bind<number>(moduleBindingIdentifiers[bindingIndex]!)
      .toConstantValue(bindingIndex);
  }
});

function buildFromModules20Bench(): () => void {
  return () => {
    const container = new Container();
    container.load(twentyBindingContainerModule);
  };
}

const mixedScalarConstantIdentifier = Symbol.for("bench-inv-mix-c");
const mixedNamedAlternativesIdentifier = Symbol.for("bench-inv-mix-wide");
const mixedDynamicChainBaseIdentifier = Symbol.for("bench-inv-mix-d0");
const mixedDynamicChainStep1Identifier = Symbol.for("bench-inv-mix-d1");
const mixedDynamicChainStep2Identifier = Symbol.for("bench-inv-mix-d2");
const mixedDynamicChainStep3Identifier = Symbol.for("bench-inv-mix-d3");

function buildMixedResolveBurstBench(): () => void {
  const container = new Container();
  container.bind<number>(mixedScalarConstantIdentifier).toConstantValue(1);
  container.bind<number>(mixedNamedAlternativesIdentifier).toConstantValue(10).whenNamed("a");
  container.bind<number>(mixedNamedAlternativesIdentifier).toConstantValue(20).whenNamed("b");
  container.bind<number>(mixedNamedAlternativesIdentifier).toConstantValue(30).whenNamed("c");
  container.bind<number>(mixedDynamicChainBaseIdentifier).toConstantValue(0);
  container
    .bind<number>(mixedDynamicChainStep1Identifier)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(mixedDynamicChainBaseIdentifier) + 1,
    )
    .inTransientScope();
  container
    .bind<number>(mixedDynamicChainStep2Identifier)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(mixedDynamicChainStep1Identifier) + 1,
    )
    .inTransientScope();
  container
    .bind<number>(mixedDynamicChainStep3Identifier)
    .toDynamicValue(
      (resolutionContext) => resolutionContext.get<number>(mixedDynamicChainStep2Identifier) + 1,
    )
    .inTransientScope();
  container.bind<InvDep>(dependencyClassIdentifier).to(InvDep).inSingletonScope();
  container.bind<InvService>(serviceClassIdentifier).to(InvService).inSingletonScope();

  container.get(mixedScalarConstantIdentifier);
  container.get(mixedNamedAlternativesIdentifier, { name: "b" });
  container.get(mixedDynamicChainStep3Identifier);
  container.get(serviceClassIdentifier);

  return () => {
    container.get(mixedScalarConstantIdentifier);
    container.get(mixedScalarConstantIdentifier);
    container.get(mixedNamedAlternativesIdentifier, { name: "a" });
    container.get(mixedNamedAlternativesIdentifier, { name: "b" });
    container.get(mixedNamedAlternativesIdentifier, { name: "c" });
    container.get(mixedDynamicChainStep3Identifier);
    container.get(serviceClassIdentifier);
    container.get(serviceClassIdentifier);
  };
}

function buildContainerCreateBench(): () => void {
  return () => {
    new Container();
  };
}

async function main(): Promise<{ id: string; hz: number; meanMs: number }[]> {
  const bench = new Bench(BENCH_OPTIONS);

  bench
    .add("constant-resolve", buildConstantBench())
    .add("singleton-class-1-dep", buildSingletonClassBench())
    .add("transient-class-1-dep", buildTransientClassBench())
    .add("named-constant-get", buildNamedConstantBench())
    .add("dynamic-chain-4", buildDynamicChain4Bench())
    .add("dynamic-transient-chain-16", buildDynamicTransientChain16Bench())
    .add("resolveall-named-48", buildResolveAllNamed48Bench())
    .add("rotate-constants-32", buildRotateConstants32Bench())
    .add("child-inherit-resolve-8", buildChildInheritResolve8Bench())
    .add("from-modules-20-bindings", buildFromModules20Bench())
    .add("mixed-resolve-burst", buildMixedResolveBurstBench())
    .add("container-create-empty", buildContainerCreateBench());

  await bench.run();

  return bench.tasks.map((benchTask) => {
    const benchTaskResult = benchTask.result;
    if (benchTaskResult.state !== "completed") {
      return { id: benchTask.name, hz: 0, meanMs: 0 };
    }
    return {
      id: benchTask.name,
      hz: benchTaskResult.throughput.mean,
      meanMs: benchTaskResult.latency.mean * 1000,
    };
  });
}

void main().then((benchmarkRows) => {
  console.log(JSON.stringify(benchmarkRows));
});
