/**
 * The async plan lane: statically-visible graphs entering `resolveAsync` compile once, and every
 * behavior the interpreted async path shows — escapes, hooks, cycles, awaited deps — survives.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { injectable } from "#/decorators/injectable";
import type { DiagnosableContainer } from "#/errors/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/errors/diagnostics";
import { CircularDependencyError } from "#/errors/errors";

function asyncPlanCount(container: unknown): number {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]().compiledAsyncPlanCount;
}

describe("async instantiation plans", () => {
  it("compiles a resolved-async chain and answers it correctly", async () => {
    const first = token<number>("async-plan.chain.first");
    const second = token<number>("async-plan.chain.second");
    const third = token<number>("async-plan.chain.third");
    const container = Container.create();
    container.bind(first).toConstantValue(1);
    container
      .bind(second)
      .toResolvedAsync(async (value: number) => value + 1, [first])
      .transient();
    container
      .bind(third)
      .toResolvedAsync(async (value: number) => value + 1, [second])
      .transient();

    expect(await container.resolveAsync(third)).toBe(3);
    // The optimization must be active, not merely the answer correct.
    expect(asyncPlanCount(container)).toBeGreaterThan(0);
    expect(await container.resolveAsync(third)).toBe(3);
  });

  it("runs a fully synchronous class chain through the async entry on a plan", async () => {
    @injectable()
    class Leaf {
      readonly depth = 0;
    }
    @injectable([Leaf])
    class Root {
      constructor(readonly leaf: Leaf) {}
    }
    const container = Container.create();
    container.bind(Leaf).toSelf().transient();
    container.bind(Root).toSelf().transient();

    // First resolve discovers lifecycle metadata (interpreted); the second compiles.
    expect((await container.resolveAsync(Root)).leaf.depth).toBe(0);
    expect((await container.resolveAsync(Root)).leaf.depth).toBe(0);
    expect(asyncPlanCount(container)).toBeGreaterThan(0);
  });

  it("awaits a promise-valued constant exactly as the interpreted path does", async () => {
    const setting = token<number>("async-plan.promise-constant");
    const root = token<number>("async-plan.promise-constant.root");
    const container = Container.create();
    container.bind(setting).toConstantValue(Promise.resolve(41) as unknown as number);
    container
      .bind(root)
      .toResolvedAsync(async (value: number) => value + 1, [setting])
      .transient();

    expect(await container.resolveAsync(root)).toBe(42);
  });

  it("carries a named criterion into the cold-singleton escape", async () => {
    const driver = token<string>("async-plan.named-driver");
    const root = token<string>("async-plan.named-root");
    const container = Container.create();
    container
      .bind(driver)
      .toDynamic(() => "default-driver")
      .singleton();
    container
      .bind(driver)
      .toDynamic(() => "primary-driver")
      .whenNamed("primary")
      .singleton();
    container
      .bind(root)
      .toResolvedAsync(
        async (value: string) => `via:${value}`,
        [{ token: driver, optional: false, multi: false, name: "primary" }],
      )
      .transient();

    // Cold: the escape must replay the name, not fall back to the default slot.
    expect(await container.resolveAsync(root)).toBe("via:primary-driver");
    // Warm: the cached named singleton answers from the plan's field read.
    expect(await container.resolveAsync(root)).toBe("via:primary-driver");
  });

  it("invalidates a compiled plan when an activation hook registers later", async () => {
    const value = token<number>("async-plan.late-hook");
    const container = Container.create();
    container
      .bind(value)
      .toResolvedAsync(async () => 1, [])
      .transient();

    expect(await container.resolveAsync(value)).toBe(1);
    expect(asyncPlanCount(container)).toBeGreaterThan(0);

    container.onActivation(value, (_ctx, instance) => instance + 10);
    expect(await container.resolveAsync(value)).toBe(11);
  });

  it("reports a static resolved-async cycle as a rejection", async () => {
    const left = token<number>("async-plan.cycle.left");
    const right = token<number>("async-plan.cycle.right");
    const container = Container.create();
    container
      .bind(left)
      .toResolvedAsync(async (value: number) => value, [right])
      .transient();
    container
      .bind(right)
      .toResolvedAsync(async (value: number) => value, [left])
      .transient();

    await expect(container.resolveAsync(left)).rejects.toBeInstanceOf(CircularDependencyError);
  });

  it("escapes instead of planning when requested inside an open cascade", async () => {
    const planned = token<number>("async-plan.mid-cascade.planned");
    const entry = token<number>("async-plan.mid-cascade.entry");
    const container = Container.create();
    container
      .bind(planned)
      .toResolvedAsync(async () => 7, [])
      .transient();
    container
      .bind(entry)
      // The request runs in the factory's synchronous prefix — the cascade is open.
      .toDynamicAsync(async (ctx) => (await ctx.resolveAsync(planned)) + 1)
      .transient();

    expect(await container.resolveAsync(entry)).toBe(8);
  });

  it("turns a sync throw inside an inlined subtree into a rejection", async () => {
    const root = token<number>("async-plan.sync-throw");
    const container = Container.create();
    container
      .bind(root)
      .toResolved((): number => {
        throw new Error("factory exploded");
      }, [])
      .transient();

    // Warm the plan first, then assert the failure shape.
    await expect(container.resolveAsync(root)).rejects.toThrow("factory exploded");
    await expect(container.resolveAsync(root)).rejects.toThrow("factory exploded");
  });
});
