import { afterEach, describe, expect, it, vi } from "vitest";
import { Container, Module, token } from "#/index";

describe("Integration: Advanced Constraints", () => {
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
      .when((ctx) => ctx.parent?.registryKey === ParentToken);

    container
      .bind(ChildToken)
      .toConstantValue("from-root")
      .when((ctx) => ctx.parent === undefined);

    container
      .bind(ParentToken)
      .toDynamic((ctx) => ({ child: ctx.resolve(ChildToken) }))
      .singleton();

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
      .when((ctx) => ctx.ancestors.some((ancestor) => ancestor.registryKey === RootToken));

    container
      .bind(LeafToken)
      .toConstantValue("default")
      .when((ctx) => ctx.parent === undefined);

    container
      .bind(MidToken)
      .toDynamic((ctx) => ({ leaf: ctx.resolve(LeafToken) }))
      .singleton();

    container
      .bind(RootToken)
      .toDynamic((ctx) => {
        ctx.resolve(MidToken);
        return {};
      })
      .singleton();

    expect(container.resolve(LeafToken)).toBe("default");
    container.resolve(RootToken);
    const mid = container.resolve(MidToken) as { leaf: string };
    expect(mid.leaf).toBe("under-root");
  });

  it("whenParentTagged matches parent binding tags on the materialization stack", () => {
    const ApiToken = token<string>("ApiToken");
    const ParentToken = token<{ v: string }>("TaggedParent");
    const tag = "role";

    const container = Container.create();

    container
      .bind(ApiToken)
      .toConstantValue("prod")
      .whenTagged(tag, "prod")
      .when((ctx) => ctx.parent?.tags.get(tag) === "prod");

    container
      .bind(ApiToken)
      .toConstantValue("dev")
      .whenTagged(tag, "dev")
      .when((ctx) => ctx.parent?.tags.get(tag) === "dev");

    container
      .bind(ApiToken)
      .toConstantValue("standalone")
      .when((ctx) => ctx.parent === undefined);

    container
      .bind(ParentToken)
      .toDynamic((ctx) => ({ v: ctx.resolve(ApiToken) }))
      .singleton()
      .whenTagged(tag, "prod");

    const parent = container.resolve(ParentToken);
    expect(parent.v).toBe("prod");
    expect(container.resolve(ApiToken)).toBe("standalone");
  });

  it("ResolutionContext.resolveAll preserves parent-aware when constraints", () => {
    const ParentToken = token<{ children: string[] }>("ParentResolveAllToken");
    const ChildToken = token<string>("ChildResolveAllToken");

    const container = Container.create();

    container
      .bind(ChildToken)
      .toConstantValue("from-parent")
      .when((ctx) => ctx.parent?.registryKey === ParentToken);

    container
      .bind(ChildToken)
      .toConstantValue("from-root")
      .when((ctx) => ctx.parent === undefined);

    container
      .bind(ParentToken)
      .toDynamic((ctx) => ({ children: ctx.resolveAll(ChildToken) }))
      .singleton();

    expect(container.resolveAll(ChildToken)).toEqual(["from-root"]);
    expect(container.resolve(ParentToken).children).toEqual(["from-parent"]);
  });

  it("isolates materialization stacks across concurrent resolveAsync roots", async () => {
    const firstConcurrentToken = token<string>("concurrent-root-a");
    const secondConcurrentToken = token<string>("concurrent-root-b");
    const container = Container.create();
    container.bind(firstConcurrentToken).toConstantValue("a");
    container.bind(secondConcurrentToken).toConstantValue("b");

    const results = await Promise.all([
      container.resolveAsync(firstConcurrentToken),
      container.resolveAsync(secondConcurrentToken),
      container.resolveAsync(firstConcurrentToken),
    ]);
    expect(results).toEqual(["a", "b", "a"]);
  });

  it("runs validate() at most once in development after load or resolve", () => {
    vi.stubEnv("NODE_ENV", "development");

    const devValidationToken = token<number>("dev-validation-once-token");
    const Mod = Module.create("mod", (api) => {
      api.bind(devValidationToken).toConstantValue(1);
    });

    const container = Container.create();
    const validateSpy = vi.spyOn(container, "validate");

    container.load(Mod);
    expect(validateSpy).toHaveBeenCalledTimes(1);

    container.resolve(devValidationToken);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  it("skips automatic validate when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const productionSkipValidateToken = token<number>("production-skip-validate-token");
    const container = Container.create();
    container.bind(productionSkipValidateToken).toConstantValue(1);
    const validateSpy = vi.spyOn(container, "validate");

    container.resolve(productionSkipValidateToken);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  it("initializeAsync warms all singleton bindings including async-dynamic", async () => {
    const Sync = token<string>("Sync");
    const Async = token<string>("Async");

    const container = Container.create();
    container.bind(Sync).toConstantValue("sync");
    container
      .bind(Async)
      .toDynamicAsync(async () => "async")
      .singleton();

    const syncBindings = container.lookupBindings(Sync);
    const asyncBindings = container.lookupBindings(Async);
    const syncBinding = syncBindings?.[0];
    const asyncBinding = asyncBindings?.[0];
    expect(syncBinding).toBeDefined();
    expect(asyncBinding).toBeDefined();
    if (syncBinding === undefined || asyncBinding === undefined) {
      throw new Error("expected sync and async bindings");
    }

    const statusOf = (bindingId: string) =>
      container.inspect().bindings.find((row) => row.bindingId === bindingId)?.activationStatus;

    expect(statusOf(syncBinding.id)).toBe("not-cached");
    expect(statusOf(asyncBinding.id)).toBe("not-cached");

    await container.initializeAsync();
    expect(statusOf(syncBinding.id)).toBe("cached");
    expect(statusOf(asyncBinding.id)).toBe("cached");
  });
});
