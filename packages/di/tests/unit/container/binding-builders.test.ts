/**
 * Registry-consistency tests for the fluent chain: a held builder refined after later registry
 * mutations must never undo them, and in-place refinements must keep the cached-instance state
 * coherent with the scope manager.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { TokenNotBoundError } from "#/errors/errors";

describe("held chains vs later registry mutations", () => {
  it("does not undo an unbind when the chain is refined afterwards", () => {
    const valueToken = token<number>("chain.unbind");
    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    const chain = container.bind(valueToken).toConstantValue(2);
    container.unbind(valueToken);

    chain.whenNamed("x");

    expect(() => container.resolve(valueToken)).toThrow(TokenNotBoundError);
    expect(() => container.resolve(valueToken, { name: "x" })).toThrow(TokenNotBoundError);
  });

  it("keeps the newest binding when a displaced chain is refined afterwards", () => {
    const valueToken = token<number>("chain.newest");
    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    const chain = container.bind(valueToken).toConstantValue(2);
    container.bind(valueToken).toConstantValue(3);

    chain.whenNamed("x");

    expect(container.resolve(valueToken)).toBe(3);
  });

  it("still restores the transiently displaced default within one chain's own morph", () => {
    const valueToken = token<number>("chain.morph");
    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    container.bind(valueToken).toConstantValue(2).whenNamed("special");

    expect(container.resolve(valueToken)).toBe(1);
    expect(container.resolve(valueToken, { name: "special" })).toBe(2);
  });
});

describe("scope refinement vs the cached instance", () => {
  it("discards the cached singleton when the scope changes, and does not resurrect it later", () => {
    const serviceToken = token<{ n: number }>("scope.flip");
    let constructed = 0;
    const container = Container.create();
    const chain = container.bind(serviceToken).toDynamic(() => ({ n: (constructed += 1) }));
    chain.singleton();

    const first = container.resolve(serviceToken);
    expect(first.n).toBe(1);

    chain.transient();
    expect(container.resolve(serviceToken).n).toBe(2);
    expect(container.resolve(serviceToken).n).toBe(3);

    chain.singleton();
    const fresh = container.resolve(serviceToken);
    expect(fresh).not.toBe(first);
    expect(fresh.n).toBe(4);
    expect(container.resolve(serviceToken)).toBe(fresh);
  });

  it("deactivates a re-slotted singleton exactly once", async () => {
    const serviceToken = token<{ closed: number }>("reslot.deactivate");
    const instance = { closed: 0 };
    const container = Container.create();
    const chain = container.bind(serviceToken).toDynamic(() => instance);
    chain.singleton().onDeactivation((value) => {
      value.closed += 1;
    });

    container.resolve(serviceToken);
    chain.whenNamed("x");
    container.unbind(serviceToken);
    await container.dispose();

    expect(instance.closed).toBe(1);
  });

  it("keeps a cached undefined singleton across a re-slot", () => {
    const maybeToken = token<string | undefined>("reslot.undefined");
    let calls = 0;
    const container = Container.create();
    const chain = container.bind(maybeToken).toDynamic(() => {
      calls += 1;
      return undefined;
    });
    chain.singleton();

    expect(container.resolve(maybeToken)).toBeUndefined();
    expect(calls).toBe(1);

    chain.whenNamed("x");

    expect(container.resolve(maybeToken, { name: "x" })).toBeUndefined();
    expect(calls).toBe(1);
  });
});
