/**
 * The memo behind a dependency's resolve options: one object per slot, shared by every container
 * that resolves through it, and reachable from user code as `currentResolveOptions`.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import type { ConstraintContext } from "#/core/types";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import type { DependencySlot } from "#/injection/resolve-options";
import { resolveOptionsForSlot } from "#/injection/resolve-options";

function slotFor(criteria: Partial<Pick<DependencySlot, "name" | "tags">>): DependencySlot {
  return { token: token<string>("slot-subject"), optional: false, multi: false, ...criteria };
}

describe("resolveOptionsForSlot", () => {
  it("answers a slot with no criterion without building anything", () => {
    expect(resolveOptionsForSlot(slotFor({}))).toBeUndefined();
  });

  it("hands out one object for the life of a slot", () => {
    const slot = slotFor({ name: "primary" });

    expect(resolveOptionsForSlot(slot)).toBe(resolveOptionsForSlot(slot));
  });

  it("freezes what it memoizes, so no holder can rewrite the request", () => {
    const options = resolveOptionsForSlot(slotFor({ name: "primary" }));

    expect(Object.isFrozen(options)).toBe(true);
    expect(() => {
      (options as { name?: string }).name = "rewritten";
    }).toThrow(TypeError);
  });

  it("keeps answering for a frozen slot, rebuilding rather than throwing", () => {
    const slot = Object.freeze(slotFor({ name: "primary" }));
    const first = resolveOptionsForSlot(slot);
    const second = resolveOptionsForSlot(slot);

    expect(first).toEqual({ name: "primary" });
    expect(second).toEqual({ name: "primary" });
    expect(second).not.toBe(first);
  });

  it("carries no criterion between two containers reading the same slot", () => {
    const driverToken = token<string>("shared-slot-driver");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const first = Container.create();

    first.bind(driverToken).toConstantValue("first-primary").whenNamed("primary");
    first.bind(driverToken).toConstantValue("first-backup").whenNamed("backup");
    first.bind(Root).toSelf().transient();

    const second = Container.create();

    second.bind(driverToken).toConstantValue("second-primary").whenNamed("primary");
    second.bind(driverToken).toConstantValue("second-backup").whenNamed("backup");
    second.bind(Root).toSelf().transient();

    expect(first.resolve(Root).driver).toBe("first-primary");
    expect(second.resolve(Root).driver).toBe("second-primary");
    expect(first.resolve(Root).driver).toBe("first-primary");
  });

  it("refuses a constraint that tries to rewrite the request it was shown", () => {
    const driverToken = token<string>("constraint-slot-driver");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    let seen: ConstraintContext["currentResolveOptions"];

    container
      .bind(driverToken)
      .toConstantValue("primary-driver")
      .whenNamed("primary")
      .when((context) => {
        seen = context.currentResolveOptions;

        return true;
      });
    container.bind(Root).toSelf().transient();

    expect(container.resolve(Root).driver).toBe("primary-driver");
    expect(seen).toEqual({ name: "primary" });
    expect(() => {
      (seen as unknown as { name?: string }).name = "backup";
    }).toThrow(TypeError);
    expect(container.resolve(Root).driver).toBe("primary-driver");
  });
});
