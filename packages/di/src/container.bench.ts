/**
 * Microbenchmarks for the container (Vitest bench + Tinybench, source via SWC).
 *
 * Numbers reflect this runner and transpilation pipeline — use them for
 * **regression on the same machine**, not to compare across hardware or to npm
 * consumers’ bundles. For local baselines: `pnpm run bench:baseline` then
 * `pnpm run bench:compare` after changes (`bench/baseline.json` is gitignored).
 */
import { bench, describe } from "vitest";
import { Container } from "#/container";
import { injectable } from "#/decorators/injectable";
import { Module } from "#/module";
import { token } from "#/token";

const benchConstantToken = token<number>("bench-constant");
const benchColdToken = token<number>("bench-cold");
const benchSingletonDep = token<number>("bench-singleton-dep");

@injectable([benchSingletonDep])
class BenchConsumer {
  constructor(readonly dep: number) {}
}

const benchConsumerToken = token<BenchConsumer>("bench-consumer");
const benchMultiToken = token<string>("bench-multi");
const benchParentToken = token<string>("bench-parent-inherited");

const benchMultiModule = Module.create("bench-multi-mod", (api) => {
  api.bind(benchMultiToken).whenNamed("a").toConstantValue("x");
  api.bind(benchMultiToken).whenNamed("b").toConstantValue("y");
  api.bind(benchMultiToken).whenNamed("c").toConstantValue("z");
});

/** Linear chain: t0 constant, t1..tN transient `toDynamic` each resolving previous (stresses nested ctx.resolve). */
const CHAIN_DEPTH = 16;
const benchChainTokens = Array.from({ length: CHAIN_DEPTH }, (_, i) =>
  token<number>(`bench-chain-${i}`),
);

function bindDeepTransientChain(container: Container): void {
  container.bind(benchChainTokens[0]!).toConstantValue(0);
  for (let i = 1; i < CHAIN_DEPTH; i++) {
    const previousChainToken = benchChainTokens[i - 1]!;
    const currentChainToken = benchChainTokens[i]!;
    container
      .bind(currentChainToken)
      .toDynamic((resolverContext) => resolverContext.resolve(previousChainToken) + 1)
      .transient();
  }
}

const WIDE_MULTI_COUNT = 48;
const benchWideToken = token<number>("bench-wide-multi");
const benchWideModule = Module.create("bench-wide-mod", (api) => {
  for (let i = 0; i < WIDE_MULTI_COUNT; i++) {
    api.bind(benchWideToken).whenNamed(`slot-${i}`).toConstantValue(i);
  }
});

const benchResolvedA = token<number>("bench-to-resolved-a");
const benchResolvedB = token<number>("bench-to-resolved-b");
const benchResolvedOutputToken = token<number>("bench-to-resolved-out");

const benchAliasLeaf = token<number>("bench-alias-leaf");
const benchAliasMid = token<number>("bench-alias-mid");
const benchAliasRoot = token<number>("bench-alias-root");

const benchTransientDep = token<number>("bench-transient-dep");

@injectable([benchTransientDep])
class BenchTransientService {
  constructor(readonly dep: number) {}
}

const benchTransientServiceToken = token<BenchTransientService>("bench-transient-svc");

const benchPairLeft = token<number>("bench-pair-left");
const benchPairRight = token<number>("bench-pair-right");

@injectable([benchPairLeft, benchPairRight])
class BenchPairConsumer {
  constructor(
    readonly left: number,
    readonly right: number,
  ) {}
}

const benchPairConsumerToken = token<BenchPairConsumer>("bench-pair-consumer");

const benchTaggedToken = token<number>("bench-tagged-svc");
const BENCH_TAG_KEY = "bench-tier";

const benchDiamondLeafToken = token<number>("bench-diamond-leaf");
const benchDiamondLeafModule = Module.create("bench-diamond-leaf", (api) => {
  api.bind(benchDiamondLeafToken).toConstantValue(1);
});
const benchDiamondLeftModule = Module.create("bench-diamond-left", (api) => {
  api.import(benchDiamondLeafModule);
});
const benchDiamondRightModule = Module.create("bench-diamond-right", (api) => {
  api.import(benchDiamondLeafModule);
});
const benchDiamondRootModule = Module.create("bench-diamond-root", (api) => {
  api.import(benchDiamondLeftModule, benchDiamondRightModule);
});

describe("container primitives", () => {
  bench("Container.create", () => {
    Container.create();
  });

  const constantContainer = Container.create();
  constantContainer.bind(benchConstantToken).toConstantValue(42);

  bench("resolve toConstantValue (steady state)", () => {
    constantContainer.resolve(benchConstantToken);
  });

  bench("create + bind + resolve (per iteration)", () => {
    const container = Container.create();
    container.bind(benchColdToken).toConstantValue(1);
    container.resolve(benchColdToken);
  });

  const steadyStateContainerForHasToken = Container.create();
  steadyStateContainerForHasToken.bind(benchConstantToken).toConstantValue(1);

  bench("has(token) steady state", () => {
    steadyStateContainerForHasToken.has(benchConstantToken);
  });

  const optionalContainer = Container.create();
  const missingOptionalToken = token<number>("bench-missing-opt");
  optionalContainer.bind(benchConstantToken).toConstantValue(1);

  bench("resolveOptional (hit)", () => {
    optionalContainer.resolveOptional(benchConstantToken);
  });

  bench("resolveOptional (miss)", () => {
    optionalContainer.resolveOptional(missingOptionalToken);
  });
});

describe("singleton and @injectable", () => {
  const graphContainer = Container.create();
  graphContainer.bind(benchSingletonDep).toConstantValue(7);
  graphContainer.bind(benchConsumerToken).to(BenchConsumer).singleton();
  graphContainer.resolve(benchConsumerToken);

  bench("resolve @injectable singleton (cached instance)", () => {
    graphContainer.resolve(benchConsumerToken);
  });

  const transientContainer = Container.create();
  transientContainer.bind(benchTransientDep).toConstantValue(99);
  transientContainer.bind(benchTransientServiceToken).to(BenchTransientService).transient();

  bench("resolve @injectable transient (new instance each time)", () => {
    transientContainer.resolve(benchTransientServiceToken);
  });
});

describe("dynamic graph", () => {
  const deepContainer = Container.create();
  bindDeepTransientChain(deepContainer);
  const deepestChainToken = benchChainTokens[CHAIN_DEPTH - 1]!;

  bench(`resolve deep transient chain (${CHAIN_DEPTH} dynamics)`, () => {
    deepContainer.resolve(deepestChainToken);
  });

  const resolvedContainer = Container.create();
  resolvedContainer.bind(benchResolvedA).toConstantValue(10);
  resolvedContainer.bind(benchResolvedB).toConstantValue(32);
  resolvedContainer
    .bind(benchResolvedOutputToken)
    .toResolved(
      (resolvedLeft, resolvedRight) => resolvedLeft * 1000 + resolvedRight,
      [benchResolvedA, benchResolvedB],
    )
    .singleton();

  bench("resolve toResolved (singleton, cached)", () => {
    resolvedContainer.resolve(benchResolvedOutputToken);
  });

  const aliasContainer = Container.create();
  aliasContainer.bind(benchAliasLeaf).toConstantValue(5);
  aliasContainer.bind(benchAliasMid).toAlias(benchAliasLeaf);
  aliasContainer.bind(benchAliasRoot).toAlias(benchAliasMid);

  bench("resolve alias chain (2 hops)", () => {
    aliasContainer.resolve(benchAliasRoot);
  });
});

describe("hints and multi-binding", () => {
  const pairContainer = Container.create();
  pairContainer.bind(benchPairLeft).toConstantValue(11);
  pairContainer.bind(benchPairRight).toConstantValue(22);
  pairContainer.bind(benchPairConsumerToken).to(BenchPairConsumer).singleton();
  pairContainer.resolve(benchPairConsumerToken);

  bench("resolve @injectable (two distinct token deps, cached)", () => {
    pairContainer.resolve(benchPairConsumerToken);
  });

  const hintContainer = Container.create();
  hintContainer.load(benchWideModule);

  bench("resolve with name hint (disambiguate multi-binding)", () => {
    hintContainer.resolve(benchWideToken, { name: "slot-12" });
  });

  const taggedContainer = Container.create();
  for (let i = 0; i < 8; i++) {
    taggedContainer
      .bind(benchTaggedToken)
      .whenTagged(BENCH_TAG_KEY, i)
      .toConstantValue(i * i);
  }

  bench("resolve with tag hint (multi-binding)", () => {
    taggedContainer.resolve(benchTaggedToken, { tag: [BENCH_TAG_KEY, 5] });
  });

  const containerWithWideModuleLoaded = Container.create();
  containerWithWideModuleLoaded.load(benchWideModule);

  bench(`resolveAll (${WIDE_MULTI_COUNT} named bindings)`, () => {
    containerWithWideModuleLoaded.resolveAll(benchWideToken);
  });
});

describe("modules", () => {
  bench("Container.fromModules (sync module)", () => {
    Container.fromModules(benchMultiModule);
  });

  bench("Container.fromModules (diamond import graph)", () => {
    Container.fromModules(benchDiamondRootModule);
  });

  const containerWithMultiModule = Container.create();
  containerWithMultiModule.load(benchMultiModule);

  bench("resolveAll (3 named multi-bindings)", () => {
    containerWithMultiModule.resolveAll(benchMultiToken);
  });

  const containerWithWideModulePreloaded = Container.create();
  containerWithWideModulePreloaded.load(benchWideModule);

  bench("load same module again (dedup no-op)", () => {
    containerWithWideModulePreloaded.load(benchWideModule);
  });
});

describe("child container", () => {
  const parentContainer = Container.create();
  parentContainer.bind(benchParentToken).toConstantValue("parent");
  const childContainer = parentContainer.createChild();

  bench("createChild from root", () => {
    parentContainer.createChild();
  });

  bench("resolve binding inherited in child", () => {
    childContainer.resolve(benchParentToken);
  });

  const childOverrideToken = token<number>("bench-child-override");
  const rebindParentContainer = Container.create();
  rebindParentContainer.bind(childOverrideToken).toConstantValue(1);
  const rebindChildContainer = rebindParentContainer.createChild();
  rebindChildContainer.rebind(childOverrideToken).toConstantValue(2);

  bench("child rebind + resolve (overrides parent)", () => {
    rebindChildContainer.resolve(childOverrideToken);
  });
});
