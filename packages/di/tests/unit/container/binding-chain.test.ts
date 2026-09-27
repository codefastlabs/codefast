/**
 * The fluent chain registers once, in its final shape: slot steps come before `to*()` and are refused
 * after it, and a scope change afterwards keeps the cached-instance state coherent with the scope manager.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { ChainAlreadyRegisteredError, NoMatchingBindingError } from "#errors/errors";

describe("slot steps before to*()", () => {
  it.each(["when", "whenNamed", "whenTagged", "whenDefault", "many"])(
    "refuses %s() once the chain has registered",
    (step) => {
      const valueToken = token<number>(`chain.after-to.${step}`);
      const container = Container.create();
      const chain = container.bind(valueToken).toConstantValue(1);
      // JavaScript callers can still reach a slot step the types no longer offer after to*().
      const slotStep = Reflect.get(chain, step) as (argument?: unknown) => unknown;

      expect(() => slotStep.call(chain, () => true)).toThrow(ChainAlreadyRegisteredError);
      expect(container.resolve(valueToken)).toBe(1);
    },
  );

  it("leaves the default in place when a predicate-only binding joins it", () => {
    const valueToken = token<number>("chain.predicate-joins");
    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    container
      .bind(valueToken)
      .when(() => false)
      .toConstantValue(2);

    expect(container.lookupBindings(valueToken)).toHaveLength(2);
    expect(container.resolve(valueToken)).toBe(1);
  });

  it("narrows with every when(), keeping one id", () => {
    const valueToken = token<number>("chain.when-narrows");
    const container = Container.create();
    let gate = true;
    const id = container
      .bind(valueToken)
      .when(() => gate)
      .when(() => true)
      .toConstantValue(2)
      .id();

    expect(container.resolve(valueToken)).toBe(2);
    gate = false;
    // The token is still bound; its one candidate now declines, which is a selection miss.
    expect(() => container.resolve(valueToken)).toThrow(NoMatchingBindingError);
    container.unbind(id);
    expect(container.lookupBindings(valueToken)).toHaveLength(0);
  });

  it("keeps the default when a named binding joins it", () => {
    const valueToken = token<number>("chain.named-joins");
    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    container.bind(valueToken).whenNamed("special").toConstantValue(2);

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

  it("keeps the cached singleton through a refinement that leaves the scope as it was", () => {
    const serviceToken = token<{ n: number }>("scope.same");
    let constructed = 0;
    const container = Container.create();
    const chain = container.bind(serviceToken).toDynamic(() => ({ n: (constructed += 1) }));
    chain.singleton();
    const first = container.resolve(serviceToken);

    chain.singleton();

    expect(container.resolve(serviceToken)).toBe(first);
    expect(constructed).toBe(1);
  });

  it.each([
    ["the child that registered it", false],
    ["a child of the container that registered it", true],
  ])("discards the scoped instance %s cached when the scope changes", (_label, registeredOnParent) => {
    const serviceToken = token<{ n: number }>("scope.flip-scoped");
    let constructed = 0;
    const parent = Container.create();
    const request = parent.createChild();
    const chain = (registeredOnParent ? parent : request)
      .bind(serviceToken)
      .toDynamic(() => ({ n: (constructed += 1) }));
    chain.scoped();
    const first = request.resolve(serviceToken);
    expect(request.resolve(serviceToken)).toBe(first);

    chain.transient();
    chain.scoped();

    const fresh = request.resolve(serviceToken);
    expect(fresh).not.toBe(first);
    expect(request.resolve(serviceToken)).toBe(fresh);
  });

  it("discards a parent-registered scoped instance a child cached through the async lane", async () => {
    const serviceToken = token<{ n: number }>("scope.flip-scoped-async");
    let constructed = 0;
    const parent = Container.create();
    const request = parent.createChild();
    const chain = parent.bind(serviceToken).toDynamic(() => ({ n: (constructed += 1) }));
    chain.scoped();
    const first = await request.resolveAsync(serviceToken);

    chain.transient();
    chain.scoped();

    const fresh = await request.resolveAsync(serviceToken);
    expect(fresh).not.toBe(first);
    expect(await request.resolveAsync(serviceToken)).toBe(fresh);
  });
});
