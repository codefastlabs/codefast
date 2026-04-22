/**
 * @codefast/di — same logical scenarios as `inversify-benches.ts` for side-by-side comparison.
 * Run via: `pnpm exec tsx --tsconfig tsconfig.codefast.json src/codefast-benches.ts`
 */
import { Bench } from "tinybench";
import { Container, injectable, Module, token } from "@codefast/di";

/** Default duration (keep in sync with inversify-benches.ts). Raise locally for stabler numbers. */
const BENCH_OPTIONS = {
  time: 450,
  iterations: 800,
  warmupTime: 60,
  warmupIterations: 60,
} as const;

/** Keep numeric knobs in sync with `inversify-benches.ts`. */
const WIDE_N = 48;
const CHAIN_DEEP = 16;
const ROTATE_N = 32;
const MODULE_BINDS = 20;
const CHILD_DEPTH = 8;

const constantValueBindingToken = token<number>("bench-cf-constant");
const wideNamedBindingToken = token<number>("bench-cf-wide");

@injectable()
class CfDep {}

const dependencyClassToken = token<CfDep>("bench-cf-dep-class");
const serviceClassToken = token<CfService>("bench-cf-svc-class");

@injectable([dependencyClassToken])
class CfService {
  constructor(readonly dep: CfDep) {}
}

function buildConstantBench(): () => void {
  const container = Container.create();
  container.bind(constantValueBindingToken).toConstantValue(42);
  container.resolve(constantValueBindingToken);
  return () => {
    container.resolve(constantValueBindingToken);
  };
}

function buildSingletonClassBench(): () => void {
  const container = Container.create();
  container.bind(dependencyClassToken).to(CfDep).singleton();
  container.bind(serviceClassToken).to(CfService).singleton();
  container.resolve(serviceClassToken);
  return () => {
    container.resolve(serviceClassToken);
  };
}

function buildTransientClassBench(): () => void {
  const container = Container.create();
  container.bind(dependencyClassToken).to(CfDep);
  container.bind(serviceClassToken).to(CfService).transient();
  return () => {
    container.resolve(serviceClassToken);
  };
}

function buildNamedConstantBench(): () => void {
  const container = Container.create();
  container.bind(wideNamedBindingToken).whenNamed("slot-5").toConstantValue(5);
  container.bind(wideNamedBindingToken).whenNamed("slot-12").toConstantValue(12);
  container.bind(wideNamedBindingToken).whenNamed("slot-20").toConstantValue(20);
  container.resolve(wideNamedBindingToken, { name: "slot-12" });
  return () => {
    container.resolve(wideNamedBindingToken, { name: "slot-12" });
  };
}

function buildDynamicChain4Bench(): () => void {
  const chainTokenAtDepth0 = token<number>("cf-chain-0");
  const chainTokenAtDepth1 = token<number>("cf-chain-1");
  const chainTokenAtDepth2 = token<number>("cf-chain-2");
  const chainTokenAtDepth3 = token<number>("cf-chain-3");
  const container = Container.create();
  container.bind(chainTokenAtDepth0).toConstantValue(0);
  container
    .bind(chainTokenAtDepth1)
    .toDynamic((resolutionContext) => resolutionContext.resolve(chainTokenAtDepth0) + 1)
    .transient();
  container
    .bind(chainTokenAtDepth2)
    .toDynamic((resolutionContext) => resolutionContext.resolve(chainTokenAtDepth1) + 1)
    .transient();
  container
    .bind(chainTokenAtDepth3)
    .toDynamic((resolutionContext) => resolutionContext.resolve(chainTokenAtDepth2) + 1)
    .transient();
  container.resolve(chainTokenAtDepth3);
  return () => {
    container.resolve(chainTokenAtDepth3);
  };
}

function buildDynamicTransientChain16Bench(): () => void {
  const deepChainTokens = Array.from({ length: CHAIN_DEEP }, (_, depthIndex) =>
    token<number>(`cf-deep-${depthIndex}`),
  );
  const container = Container.create();
  container.bind(deepChainTokens[0]!).toConstantValue(0);
  for (let chainDepthIndex = 1; chainDepthIndex < CHAIN_DEEP; chainDepthIndex++) {
    const previousDepthToken = deepChainTokens[chainDepthIndex - 1]!;
    const currentDepthToken = deepChainTokens[chainDepthIndex]!;
    container
      .bind(currentDepthToken)
      .toDynamic((resolutionContext) => resolutionContext.resolve(previousDepthToken) + 1)
      .transient();
  }
  const leafChainToken = deepChainTokens[CHAIN_DEEP - 1]!;
  container.resolve(leafChainToken);
  return () => {
    container.resolve(leafChainToken);
  };
}

function buildResolveNamed48xBench(): () => void {
  const manyNamedSlotsBindingToken = token<number>("bench-cf-wide-48");
  const container = Container.create();
  for (let slotIndex = 0; slotIndex < WIDE_N; slotIndex++) {
    container
      .bind(manyNamedSlotsBindingToken)
      .whenNamed(`slot-${slotIndex}`)
      .toConstantValue(slotIndex);
  }
  for (let slotIndex = 0; slotIndex < WIDE_N; slotIndex++) {
    container.resolve(manyNamedSlotsBindingToken, { name: `slot-${slotIndex}` });
  }
  return () => {
    for (let slotIndex = 0; slotIndex < WIDE_N; slotIndex++) {
      container.resolve(manyNamedSlotsBindingToken, { name: `slot-${slotIndex}` });
    }
  };
}

function buildRotateConstants32Bench(): () => void {
  const rotatingBindingTokens = Array.from({ length: ROTATE_N }, (_, slotIndex) =>
    token<number>(`bench-cf-rot-${slotIndex}`),
  );
  const container = Container.create();
  for (let slotIndex = 0; slotIndex < ROTATE_N; slotIndex++) {
    container.bind(rotatingBindingTokens[slotIndex]!).toConstantValue(slotIndex);
  }
  let rotatingTokenIndex = 0;
  return () => {
    void container.resolve(rotatingBindingTokens[rotatingTokenIndex]!);
    rotatingTokenIndex = (rotatingTokenIndex + 1) % ROTATE_N;
  };
}

function buildChildInheritResolve8Bench(): () => void {
  const childInheritanceLeafToken = token<number>("bench-cf-child-leaf");
  const rootContainer = Container.create();
  rootContainer.bind(childInheritanceLeafToken).toConstantValue(42);
  let deepestChildContainer: Container = rootContainer;
  for (let childDepthIndex = 0; childDepthIndex < CHILD_DEPTH; childDepthIndex++) {
    deepestChildContainer = deepestChildContainer.createChild();
  }
  deepestChildContainer.resolve(childInheritanceLeafToken);
  return () => {
    deepestChildContainer.resolve(childInheritanceLeafToken);
  };
}

function buildFromModules20Bench(): () => void {
  const twentyBindingModule = Module.create("bench-cf-mod20", (moduleApi) => {
    for (let bindingIndex = 0; bindingIndex < MODULE_BINDS; bindingIndex++) {
      moduleApi.bind(token<number>(`bench-cf-mod-t-${bindingIndex}`)).toConstantValue(bindingIndex);
    }
  });
  return () => {
    Container.fromModules(twentyBindingModule);
  };
}

function buildMixedResolveBurstBench(): () => void {
  const mixedScalarConstantToken = token<number>("bench-cf-mix-c");
  const mixedNamedAlternativesToken = token<number>("bench-cf-mix-wide");
  const mixedDynamicChainBaseToken = token<number>("bench-cf-mix-d0");
  const mixedDynamicChainStep1Token = token<number>("bench-cf-mix-d1");
  const mixedDynamicChainStep2Token = token<number>("bench-cf-mix-d2");
  const mixedDynamicChainStep3Token = token<number>("bench-cf-mix-d3");

  const container = Container.create();
  container.bind(mixedScalarConstantToken).toConstantValue(1);
  container.bind(mixedNamedAlternativesToken).whenNamed("a").toConstantValue(10);
  container.bind(mixedNamedAlternativesToken).whenNamed("b").toConstantValue(20);
  container.bind(mixedNamedAlternativesToken).whenNamed("c").toConstantValue(30);
  container.bind(mixedDynamicChainBaseToken).toConstantValue(0);
  container
    .bind(mixedDynamicChainStep1Token)
    .toDynamic((resolutionContext) => resolutionContext.resolve(mixedDynamicChainBaseToken) + 1)
    .transient();
  container
    .bind(mixedDynamicChainStep2Token)
    .toDynamic((resolutionContext) => resolutionContext.resolve(mixedDynamicChainStep1Token) + 1)
    .transient();
  container
    .bind(mixedDynamicChainStep3Token)
    .toDynamic((resolutionContext) => resolutionContext.resolve(mixedDynamicChainStep2Token) + 1)
    .transient();
  container.bind(dependencyClassToken).to(CfDep).singleton();
  container.bind(serviceClassToken).to(CfService).singleton();

  container.resolve(mixedScalarConstantToken);
  container.resolve(mixedNamedAlternativesToken, { name: "b" });
  container.resolve(mixedDynamicChainStep3Token);
  container.resolve(serviceClassToken);

  return () => {
    container.resolve(mixedScalarConstantToken);
    container.resolve(mixedScalarConstantToken);
    container.resolve(mixedNamedAlternativesToken, { name: "a" });
    container.resolve(mixedNamedAlternativesToken, { name: "b" });
    container.resolve(mixedNamedAlternativesToken, { name: "c" });
    container.resolve(mixedDynamicChainStep3Token);
    container.resolve(serviceClassToken);
    container.resolve(serviceClassToken);
  };
}

function buildContainerCreateBench(): () => void {
  return () => {
    Container.create();
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
    .add("resolve-named-48x", buildResolveNamed48xBench())
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
