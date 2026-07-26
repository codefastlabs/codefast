/**
 * The chain-versioned lookup memo, exercised through the public container API.
 *
 * The cases that matter are the ones where the memo must answer "I can't" and hand the resolve
 * back to the full selection path — a predicate or an alias behind a name — and the parent-chain
 * walk, where a child's cache defers to its parent's.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/token";
import type { ConstraintContext } from "#/types";

const WARM_ITERATIONS = 5;

function warm(resolveOnce: () => unknown): void {
  for (let index = 0; index < WARM_ITERATIONS; index += 1) {
    resolveOnce();
  }
}

describe("named lookup across the container chain", () => {
  it("resolves a named binding that only exists on the parent", () => {
    const driverToken = token<string>("chain-driver");
    const parent = Container.create();
    parent.bind(driverToken).toConstantValue("parent-primary").whenNamed("primary");
    const child = parent.createChild();

    warm(() => child.resolve(driverToken, { name: "primary" }));

    expect(child.resolve(driverToken, { name: "primary" })).toBe("parent-primary");
  });

  it("prefers the child's own named binding over the parent's", () => {
    const driverToken = token<string>("chain-driver-shadowed");
    const parent = Container.create();
    parent.bind(driverToken).toConstantValue("parent").whenNamed("primary");
    const child = parent.createChild();
    child.bind(driverToken).toConstantValue("child").whenNamed("primary");

    warm(() => child.resolve(driverToken, { name: "primary" }));

    expect(child.resolve(driverToken, { name: "primary" })).toBe("child");
    expect(parent.resolve(driverToken, { name: "primary" })).toBe("parent");
  });

  it("falls back to full selection for a named binding behind a predicate", () => {
    const driverToken = token<string>("chain-driver-predicate");
    const seen: Array<number> = [];
    const container = Container.create();
    container
      .bind(driverToken)
      .toConstantValue("guarded")
      .whenNamed("primary")
      .when((ctx: ConstraintContext) => {
        seen.push(ctx.resolutionPath.length);
        return true;
      });

    warm(() => container.resolve(driverToken, { name: "primary" }));
    seen.length = 0;

    expect(container.resolve(driverToken, { name: "primary" })).toBe("guarded");
    // The predicate must still run on every resolve — memoizing it away would be wrong.
    expect(seen).toHaveLength(1);
  });

  it("falls back to full selection for a named alias", () => {
    const targetToken = token<string>("chain-alias-target");
    const aliasToken = token<string>("chain-alias");
    const container = Container.create();
    // An alias carries the resolve options through to its target, so the target needs the
    // same slot — which is exactly why the memo refuses to answer for a named alias.
    container.bind(targetToken).toConstantValue("aliased").whenNamed("primary");
    container.bind(aliasToken).toAlias(targetToken).whenNamed("primary");

    warm(() => container.resolve(aliasToken, { name: "primary" }));

    expect(container.resolve(aliasToken, { name: "primary" })).toBe("aliased");
  });

  it("invalidates the memo when the parent rebinds a name the child had warmed", () => {
    const driverToken = token<string>("chain-driver-rebound");
    const parent = Container.create();
    parent.bind(driverToken).toConstantValue("before").whenNamed("primary");
    const child = parent.createChild();

    warm(() => child.resolve(driverToken, { name: "primary" }));

    parent.unbind(driverToken);
    parent.bind(driverToken).toConstantValue("after").whenNamed("primary");

    expect(child.resolve(driverToken, { name: "primary" })).toBe("after");
  });
});
