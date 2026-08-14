/**
 * Teardown robustness: one throwing hook must not strand the rest, dispose must drain in-flight
 * async materializations and refuse new ones, and a failed module load must roll back cleanly.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { Module } from "#/core/module";
import { token } from "#/core/token";
import { DisposedContainerError, TokenNotBoundError } from "#/errors/errors";

describe("dispose with throwing hooks", () => {
  it("runs the remaining deactivations after one throws, and reports the failure", async () => {
    const failingToken = token<string>("teardown.failing");
    const survivorToken = token<string>("teardown.survivor");
    const ran: Array<string> = [];
    const container = Container.create();
    container
      .bind(failingToken)
      .toDynamic(() => "a")
      .singleton()
      .onDeactivation(() => {
        throw new Error("boom in A");
      });
    container
      .bind(survivorToken)
      .toDynamic(() => "b")
      .singleton()
      .onDeactivation(() => {
        ran.push("survivor");
      });
    container.resolve(failingToken);
    container.resolve(survivorToken);

    await expect(container.dispose()).rejects.toThrow("boom in A");
    expect(ran).toEqual(["survivor"]);
  });

  it("hands every dispose() caller the same teardown run", async () => {
    const serviceToken = token<string>("teardown.same-run");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "x")
      .singleton();
    container.resolve(serviceToken);

    const first = container.dispose();
    const second = container.dispose();
    expect(second).toBe(first);
    await first;
  });

  it("deactivates dependents before their dependencies", async () => {
    const depToken = token<string>("teardown.dep");
    const consumerToken = token<{ dep: string }>("teardown.consumer");
    const ran: Array<string> = [];
    const container = Container.create();
    container
      .bind(depToken)
      .toDynamic(() => "dep")
      .singleton()
      .onDeactivation(() => {
        ran.push("dep");
      });
    container
      .bind(consumerToken)
      .toResolved((dep) => ({ dep }), [depToken])
      .singleton()
      .onDeactivation(() => {
        ran.push("consumer");
      });
    container.resolve(consumerToken);

    await container.dispose();
    expect(ran).toEqual(["consumer", "dep"]);
  });
});

describe("dispose vs in-flight async materialization", () => {
  it("drains the in-flight singleton and deactivates it instead of leaking it", async () => {
    const serviceToken = token<{ closed: boolean }>("teardown.inflight");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamicAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { closed: false };
      })
      .singleton()
      .onDeactivation((instance) => {
        instance.closed = true;
      });

    const pending = container.resolveAsync(serviceToken);
    await container.dispose();

    const instance = await pending;
    expect(instance.closed).toBe(true);
  });

  it("refuses a child's resolve of a disposed parent's singleton", async () => {
    const serviceToken = token<object>("teardown.zombie");
    let constructed = 0;
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => {
        constructed += 1;
        return {};
      })
      .singleton();
    const child = parent.createChild();
    parent.resolve(serviceToken);

    await parent.dispose();

    expect(() => child.resolve(serviceToken)).toThrow(DisposedContainerError);
    await expect(child.resolveAsync(serviceToken)).rejects.toThrow(DisposedContainerError);
    expect(constructed).toBe(1);
  });
});

describe("unbind with throwing hooks", () => {
  it("runs the remaining deactivations for the token, then reports the failure", () => {
    const serviceToken = token<string>("teardown.unbind");
    const ran: Array<string> = [];
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "a")
      .singleton()
      .onDeactivation(() => {
        throw new Error("boom");
      });
    container
      .bind(serviceToken)
      .toConstantValue("b")
      .whenNamed("x")
      .onDeactivation(() => {
        ran.push("named");
      });
    container.resolve(serviceToken);

    expect(() => container.unbind(serviceToken)).toThrow("boom");
    expect(ran).toEqual(["named"]);
    expect(() => container.resolve(serviceToken)).toThrow(TokenNotBoundError);
  });
});

describe("module load failure", () => {
  it("rolls back a sync module whose setup throws, so a retry can succeed", () => {
    const aToken = token<number>("teardown.module.a");
    const bToken = token<number>("teardown.module.b");
    let shouldFail = true;
    const module = Module.create("failing-module", (builder) => {
      builder.bind(aToken).toConstantValue(1);
      if (shouldFail) {
        throw new Error("setup failed");
      }
      builder.bind(bToken).toConstantValue(2);
    });
    const container = Container.create();

    expect(() => container.load(module)).toThrow("setup failed");
    expect(() => container.resolve(aToken)).toThrow(TokenNotBoundError);

    shouldFail = false;
    container.load(module);
    expect(container.resolve(aToken)).toBe(1);
    expect(container.resolve(bToken)).toBe(2);

    container.unload(module);
    expect(() => container.resolve(aToken)).toThrow(TokenNotBoundError);
  });

  it("rolls back an async module whose setup rejects, so a retry can succeed", async () => {
    const aToken = token<number>("teardown.module.async-a");
    const bToken = token<number>("teardown.module.async-b");
    let shouldFail = true;
    const module = Module.createAsync("failing-async-module", async (builder) => {
      builder.bind(aToken).toConstantValue(1);
      await Promise.resolve();
      if (shouldFail) {
        throw new Error("async setup failed");
      }
      builder.bind(bToken).toConstantValue(2);
    });
    const container = Container.create();

    await expect(container.loadAsync(module)).rejects.toThrow("async setup failed");
    expect(() => container.resolve(aToken)).toThrow(TokenNotBoundError);

    shouldFail = false;
    await container.loadAsync(module);
    expect(container.resolve(aToken)).toBe(1);
    expect(container.resolve(bToken)).toBe(2);
  });

  it("ref-counts a module listed twice in one loadAsync call once", async () => {
    const aToken = token<number>("teardown.module.dup");
    const module = Module.create("dup-module", (builder) => {
      builder.bind(aToken).toConstantValue(1);
    });
    const container = Container.create();

    await container.loadAsync(module, module);
    await container.unloadAsync(module);

    expect(() => container.resolve(aToken)).toThrow(TokenNotBoundError);
  });
});
