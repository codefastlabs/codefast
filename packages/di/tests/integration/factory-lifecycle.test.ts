/**
 * `@postConstruct` on the class a factory returns. The resolver reaches an instance through several
 * specialised lanes — transient dynamic sync, its async and cascade twins, the compiled plan, and
 * the general path — and each one hands the value back separately, so every lane is covered here.
 * Four of them were missed by an earlier attempt that only fixed the general path.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

/** A fresh class per test: the binding memoizes what its factory returned, keyed by that class. */
function trackedClass() {
  const started: Array<string> = [];
  const stopped: Array<string> = [];

  class Tracked {
    @postConstruct()
    start(): void {
      started.push("start");
    }

    @preDestroy()
    stop(): void {
      stopped.push("stop");
    }
  }

  return { Tracked, started, stopped };
}

describe("@postConstruct on a factory-built instance", () => {
  it("runs for a transient toDynamic resolved synchronously", () => {
    const { Tracked, started } = trackedClass();
    const serviceToken = token<object>("dynamic-transient-sync");

    const container = Container.create();
    container.bind(serviceToken).toDynamic(() => new Tracked());
    container.resolve(serviceToken);

    expect(started).toEqual(["start"]);
  });

  it("runs for a transient toDynamic resolved asynchronously", async () => {
    const { Tracked, started } = trackedClass();
    const serviceToken = token<object>("dynamic-transient-async");

    const container = Container.create();
    container.bind(serviceToken).toDynamic(() => new Tracked());
    await container.resolveAsync(serviceToken);

    expect(started).toEqual(["start"]);
  });

  it("runs for a transient toResolved, which resolves through a compiled plan", () => {
    const { Tracked, started } = trackedClass();
    const serviceToken = token<object>("resolved-transient-sync");

    const container = Container.create();
    container.bind(serviceToken).toResolved(() => new Tracked(), []);
    container.resolve(serviceToken);

    expect(started).toEqual(["start"]);
  });

  // The hook belongs to each instance, so a compiled plan must not run it once and settle.
  it("runs once per instance for repeated transient resolves", () => {
    const { Tracked, started } = trackedClass();
    const serviceToken = token<object>("resolved-transient-repeat");

    const container = Container.create();
    container.bind(serviceToken).toResolved(() => new Tracked(), []);
    for (let index = 0; index < 3; index += 1) {
      container.resolve(serviceToken);
    }

    expect(started).toEqual(["start", "start", "start"]);
  });

  it("runs for a factory reached as another binding's dependency", () => {
    const { Tracked, started } = trackedClass();
    const leafToken = token<object>("dep-leaf");
    const rootToken = token<object>("dep-root");

    const container = Container.create();
    container.bind(leafToken).toResolved(() => new Tracked(), []);
    container.bind(rootToken).toResolved((leaf: object) => ({ leaf }), [leafToken]);
    container.resolve(rootToken);

    expect(started).toEqual(["start"]);
  });

  it("runs for a singleton factory, and its @preDestroy on dispose", async () => {
    const { Tracked, started, stopped } = trackedClass();
    const serviceToken = token<object>("resolved-singleton");

    const container = Container.create();
    container
      .bind(serviceToken)
      .toResolved(() => new Tracked(), [])
      .singleton();
    container.resolve(serviceToken);

    expect(started).toEqual(["start"]);

    await container.dispose();

    expect(stopped).toEqual(["stop"]);
  });

  it("runs for a scoped factory in a child container", () => {
    const { Tracked, started } = trackedClass();
    const serviceToken = token<object>("resolved-scoped");

    const container = Container.create();
    container
      .bind(serviceToken)
      .toResolved(() => new Tracked(), [])
      .scoped();
    const child = container.createChild();
    child.resolve(serviceToken);

    expect(started).toEqual(["start"]);
  });

  // The class is read off the instance, so a factory that switches classes must be re-read.
  it("follows a factory that returns a different class on a later resolve", () => {
    const first = trackedClass();
    const second = trackedClass();
    const serviceToken = token<object>("switching-factory");

    let call = 0;
    const container = Container.create();
    container.bind(serviceToken).toDynamic(() => {
      call += 1;
      return call === 1 ? new first.Tracked() : new second.Tracked();
    });

    container.resolve(serviceToken);
    container.resolve(serviceToken);

    expect(first.started).toEqual(["start"]);
    expect(second.started).toEqual(["start"]);
  });

  it("leaves a constant alone, since the caller built that instance", async () => {
    const { Tracked, started, stopped } = trackedClass();
    const serviceToken = token<object>("constant-instance");

    const container = Container.create();
    container.bind(serviceToken).toConstantValue(new Tracked());
    container.resolve(serviceToken);
    await container.dispose();

    expect(started).toEqual([]);
    expect(stopped).toEqual([]);
  });

  it("leaves a factory returning a plain object alone", () => {
    const serviceToken = token<object>("plain-object");

    const container = Container.create();
    container.bind(serviceToken).toDynamic(() => ({ plain: true }));

    expect(() => {
      container.resolve(serviceToken);
    }).not.toThrow();
  });

  it("leaves a factory returning a primitive alone", () => {
    const serviceToken = token<number>("primitive");

    const container = Container.create();
    container.bind(serviceToken).toDynamic(() => 42);

    expect(container.resolve(serviceToken)).toBe(42);
  });
});
