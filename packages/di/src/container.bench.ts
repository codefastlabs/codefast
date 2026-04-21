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
});

describe("singleton and @injectable", () => {
  const graphContainer = Container.create();
  graphContainer.bind(benchSingletonDep).toConstantValue(7);
  graphContainer.bind(benchConsumerToken).to(BenchConsumer).singleton();
  graphContainer.resolve(benchConsumerToken);

  bench("resolve @injectable singleton (cached instance)", () => {
    graphContainer.resolve(benchConsumerToken);
  });
});

describe("modules", () => {
  bench("Container.fromModules (sync module)", () => {
    Container.fromModules(benchMultiModule);
  });

  const loaded = Container.create();
  loaded.load(benchMultiModule);

  bench("resolveAll (3 named multi-bindings)", () => {
    loaded.resolveAll(benchMultiToken);
  });
});

describe("child container", () => {
  const parent = Container.create();
  parent.bind(benchParentToken).toConstantValue("parent");
  const child = parent.createChild();

  bench("createChild from root", () => {
    parent.createChild();
  });

  bench("resolve binding inherited in child", () => {
    child.resolve(benchParentToken);
  });
});
