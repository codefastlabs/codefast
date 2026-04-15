import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Container,
  Module,
  token,
  whenAnyAncestorIs,
  whenParentIs,
  whenTargetTagged,
} from "#lib/index";

describe("@codefast/di advanced constraints & container hardening", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disambiguates multi-bindings with .when using parent metadata", () => {
    const ParentToken = token<{ child: string }>("ParentToken");
    const ChildToken = token<string>("ChildToken");

    const container = Container.create();

    container
      .bind(ChildToken)
      .toConstantValue("from-parent")
      .singleton()
      .when(whenParentIs(ParentToken))
      .build();

    container
      .bind(ChildToken)
      .toConstantValue("from-root")
      .singleton()
      .when((ctx) => ctx.parent === undefined)
      .build();

    container
      .bind(ParentToken)
      .toDynamic((ctx) => ({ child: ctx.resolve(ChildToken) }))
      .singleton()
      .build();

    expect(container.resolve(ChildToken)).toBe("from-root");

    const parent = container.resolve(ParentToken);
    expect(parent.child).toBe("from-parent");
  });

  it("whenAnyAncestorIs matches deeper stack frames", () => {
    const RootToken = token<unknown>("RootToken");
    const MidToken = token<unknown>("MidToken");
    const LeafToken = token<string>("LeafToken");

    const container = Container.create();

    container
      .bind(LeafToken)
      .toConstantValue("under-root")
      .singleton()
      .when(whenAnyAncestorIs(RootToken))
      .build();

    container
      .bind(LeafToken)
      .toConstantValue("default")
      .singleton()
      .when((ctx) => ctx.parent === undefined)
      .build();

    container
      .bind(MidToken)
      .toDynamic((ctx) => ({ leaf: ctx.resolve(LeafToken) }))
      .singleton()
      .build();

    container
      .bind(RootToken)
      .toDynamic((ctx) => {
        ctx.resolve(MidToken);
        return {};
      })
      .singleton()
      .build();

    expect(container.resolve(LeafToken)).toBe("default");
    container.resolve(RootToken);
    const mid = container.resolve(MidToken) as { leaf: string };
    expect(mid.leaf).toBe("under-root");
  });

  it("whenTargetTagged matches parent binding tags on the materialization stack", () => {
    const ApiToken = token<string>("ApiToken");
    const ParentToken = token<{ v: string }>("TaggedParent");
    const tag = Symbol("role");

    const container = Container.create();

    container
      .bind(ApiToken)
      .toConstantValue("prod")
      .singleton()
      .whenTagged(tag, "prod")
      .when(whenTargetTagged(tag, "prod"))
      .build();

    container
      .bind(ApiToken)
      .toConstantValue("dev")
      .singleton()
      .whenTagged(tag, "dev")
      .when(whenTargetTagged(tag, "dev"))
      .build();

    container
      .bind(ApiToken)
      .toConstantValue("standalone")
      .singleton()
      .when((ctx) => ctx.parent === undefined)
      .build();

    container
      .bind(ParentToken)
      .toDynamic((ctx) => ({ v: ctx.resolve(ApiToken) }))
      .singleton()
      .whenTagged(tag, "prod")
      .build();

    const parent = container.resolve(ParentToken);
    expect(parent.v).toBe("prod");
    expect(container.resolve(ApiToken)).toBe("standalone");
  });

  it("isolates materialization stacks across concurrent resolveAsync roots", async () => {
    const A = token("A");
    const B = token("B");
    const container = Container.create();
    container.bind(A).toConstantValue("a").singleton().build();
    container.bind(B).toConstantValue("b").singleton().build();

    const results = await Promise.all([
      container.resolveAsync(A),
      container.resolveAsync(B),
      container.resolveAsync(A),
    ]);
    expect(results).toEqual(["a", "b", "a"]);
  });

  it("runs validate() at most once in development after load or resolve", () => {
    vi.stubEnv("NODE_ENV", "development");

    const T = token<number>("T");
    const Mod = Module.create("mod", (api) => {
      api.bind(T).toConstantValue(1).singleton().build();
    });

    const container = Container.create();
    const validateSpy = vi.spyOn(container, "validate");

    container.load(Mod);
    expect(validateSpy).toHaveBeenCalledTimes(1);

    container.resolve(T);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  it("skips automatic validate when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const T = token<number>("T");
    const container = Container.create();
    container.bind(T).toConstantValue(1).singleton().build();
    const validateSpy = vi.spyOn(container, "validate");

    container.resolve(T);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  it("initialize() warms singleton sync bindings; initializeAsync includes async-dynamic", async () => {
    const Sync = token<string>("Sync");
    const Async = token<string>("Async");

    const container = Container.create();
    container.bind(Sync).toConstantValue("sync").singleton().build();
    container
      .bind(Async)
      .toAsyncDynamic(async () => "async")
      .singleton()
      .build();

    const syncBinding = container.lookupBindings(Sync)![0];
    const asyncBinding = container.lookupBindings(Async)![0];

    const statusOf = (bindingId: string) =>
      container
        .inspect()
        .getSnapshot()
        .bindings.find((row) => row.bindingId === bindingId)?.activationStatus;

    expect(statusOf(syncBinding.id)).toBe("not-cached");

    container.initialize();
    expect(statusOf(syncBinding.id)).toBe("cached");
    expect(statusOf(asyncBinding.id)).toBe("not-cached");

    await container.initializeAsync();
    expect(statusOf(asyncBinding.id)).toBe("cached");
  });
});
