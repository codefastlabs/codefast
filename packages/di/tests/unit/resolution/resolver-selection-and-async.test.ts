/**
 * Covers three resolver areas the existing suites leave thin: activation hooks on transient
 * dynamic bindings, asynchronous class/`toResolved` dependency construction, and slot selection
 * (`name` / `tag` / `tags`) across `resolve`, `resolveAll` and a parent chain.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { inject, injectAll, optional } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { AsyncResolutionError } from "#/errors";
import { token } from "#/token";

describe("activation on transient dynamic bindings", () => {
  it("applies the binding's own onActivation to every fresh instance", () => {
    const serviceToken = token<{ calls: number; tag: string }>("activated-transient");
    let activations = 0;

    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => ({ calls: 0, tag: "raw" }))
      .transient()
      .onActivation((_ctx, instance) => {
        activations += 1;
        return { ...instance, tag: "activated" };
      });

    const first = container.resolve(serviceToken);
    const second = container.resolve(serviceToken);

    expect(first.tag).toBe("activated");
    expect(second.tag).toBe("activated");
    expect(first).not.toBe(second);
    expect(activations).toBe(2);
  });

  it("runs the container-level hook after the binding hook", () => {
    const serviceToken = token<Array<string>>("activation-order");

    const container = Container.create();
    container.onActivation(serviceToken, (_ctx, instance): Array<string> => [...instance, "container"]);
    container
      .bind(serviceToken)
      .toDynamic(() => ["factory"])
      .transient()
      .onActivation((_ctx, instance): Array<string> => [...instance, "binding"]);

    expect(container.resolve(serviceToken)).toEqual(["factory", "binding", "container"]);
  });

  it("rejects a promise returned from a transient dynamic factory resolved synchronously", () => {
    const serviceToken = token<string>("sync-async-mismatch");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic((() => Promise.resolve("late")) as unknown as () => string)
      .transient()
      .onActivation((_ctx, instance) => instance);

    expect(() => container.resolve(serviceToken)).toThrow(AsyncResolutionError);
  });
});

describe("async construction", () => {
  it("builds a class whose dependencies resolve asynchronously", async () => {
    const configToken = token<string>("async-config");
    const clientToken = token<{ config: string }>("async-client");

    @injectable([configToken])
    class Client {
      constructor(readonly config: string) {}
    }

    const container = Container.create();
    container
      .bind(configToken)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        return "from-async";
      })
      .singleton();
    container.bind(clientToken).to(Client).singleton();

    const client = await container.resolveAsync(clientToken);

    expect(client).toBeInstanceOf(Client);
    expect(client.config).toBe("from-async");
  });

  it("supports optional and multi dependencies on the async path", async () => {
    const presentToken = token<string>("async-present");
    const absentToken = token<string>("async-absent");
    const handlerToken = token<string>("async-handler");
    const rootToken = token<{ handlers: Array<string>; missing: string | undefined; present: string }>("async-root");

    @injectable([inject(presentToken), optional(absentToken), injectAll(handlerToken)])
    class Root {
      constructor(
        readonly present: string,
        readonly missing: string | undefined,
        readonly handlers: Array<string>,
      ) {}
    }

    const container = Container.create();
    container
      .bind(presentToken)
      .toDynamicAsync(async () => Promise.resolve("here"))
      .singleton();
    container.bind(handlerToken).toConstantValue("a");
    container.bind(handlerToken).toConstantValue("b").whenNamed("second");
    container.bind(rootToken).to(Root).singleton();

    const root = await container.resolveAsync(rootToken);

    expect(root.present).toBe("here");
    expect(root.missing).toBeUndefined();
    expect(root.handlers).toHaveLength(2);
  });

  it("builds a toResolved binding whose dependency tokens resolve asynchronously", async () => {
    const leftToken = token<number>("async-left");
    const rightToken = token<number>("async-right");
    const sumToken = token<number>("async-sum");

    const container = Container.create();
    container
      .bind(leftToken)
      .toDynamicAsync(async () => Promise.resolve(2))
      .singleton();
    container.bind(rightToken).toConstantValue(3);
    container
      .bind(sumToken)
      .toResolvedAsync(async (left: number, right: number) => Promise.resolve(left + right), [leftToken, rightToken])
      .singleton();

    await expect(container.resolveAsync(sumToken)).resolves.toBe(5);
  });

  it("resolveAllAsync returns every candidate", async () => {
    const handlerToken = token<string>("async-all");

    const container = Container.create();
    container
      .bind(handlerToken)
      .toDynamicAsync(async () => Promise.resolve("one"))
      .transient();
    container
      .bind(handlerToken)
      .toDynamicAsync(async () => Promise.resolve("two"))
      .whenNamed("second")
      .transient()
      .onActivation((_ctx, value) => value);

    const all = await container.resolveAllAsync(handlerToken);

    expect(all.toSorted()).toEqual(["one", "two"]);
  });
});

describe("slot selection", () => {
  const serviceToken = token<string>("slot-service");

  function containerWithSlots(): ReturnType<typeof Container.create> {
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    container.bind(serviceToken).toConstantValue("named").whenNamed("special");
    container.bind(serviceToken).toConstantValue("prod").whenTagged("env", "prod");
    container.bind(serviceToken).toConstantValue("dev").whenTagged("env", "dev");
    return container;
  }

  it("selects by name", () => {
    expect(containerWithSlots().resolve(serviceToken, { name: "special" })).toBe("named");
  });

  it("selects by the single-tag shorthand and by the tags array", () => {
    const container = containerWithSlots();
    expect(container.resolve(serviceToken, { tag: ["env", "prod"] })).toBe("prod");
    expect(container.resolve(serviceToken, { tags: [["env", "dev"]] })).toBe("dev");
  });

  it("returns only the matching slot from resolveAll", () => {
    const container = containerWithSlots();

    expect(container.resolveAll(serviceToken, { name: "special" })).toEqual(["named"]);
    expect(container.resolveAll(serviceToken, { tag: ["env", "prod"] })).toEqual(["prod"]);
    expect(container.resolveAll(serviceToken, { name: "missing" })).toEqual([]);
    // Without a filter every candidate comes back.
    expect(container.resolveAll(serviceToken)).toHaveLength(4);
  });

  it("honours a predicate on a named binding in resolveAll, as resolve does", () => {
    // The name index answers the slot; the predicate is a further constraint, and dropping it
    // would make `resolveAll` return a candidate `resolve` refuses.
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("named")
      .whenNamed("special")
      .when(() => false);

    expect(container.resolveAll(serviceToken, { name: "special" })).toEqual([]);
    expect(container.resolveOptional(serviceToken, { name: "special" })).toBeUndefined();
  });

  it("falls back to a parent container's named binding", () => {
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue("parent-named").whenNamed("special");
    const child = parent.createChild();

    expect(child.resolve(serviceToken, { name: "special" })).toBe("parent-named");
    expect(child.resolveAll(serviceToken, { name: "special" })).toEqual(["parent-named"]);
  });

  it("prefers the child's own named binding over the parent's", () => {
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue("parent-named").whenNamed("special");
    const child = parent.createChild();
    child.bind(serviceToken).toConstantValue("child-named").whenNamed("special");

    expect(child.resolve(serviceToken, { name: "special" })).toBe("child-named");
  });

  it("resolveOptional returns undefined for a slot that does not exist", () => {
    expect(containerWithSlots().resolveOptional(serviceToken, { name: "nope" })).toBeUndefined();
  });
});
