/**
 * Deactivation-side lifecycle semantics: binding-level and container-level
 * handlers plus `@preDestroy`, across unbind, unload and dispose.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { Module } from "#core/module";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { preDestroy } from "#decorators/lifecycle";
import { AsyncDeactivationError } from "#errors";

describe("deactivation on unbind", () => {
  it("runs the binding-level onDeactivation with the cached singleton", async () => {
    const seen: Array<number> = [];
    const connectionToken = token<{ readonly id: number }>("connection");
    const container = Container.create();
    container
      .bind(connectionToken)
      .toDynamic(() => ({ id: 7 }))
      .singleton()
      .onDeactivation((instance) => {
        seen.push(instance.id);
      });

    container.resolve(connectionToken);
    await container.unbindAsync(connectionToken);
    expect(seen).toEqual([7]);
  });

  it("does not run deactivation when the singleton was never materialized", async () => {
    let called = false;
    const connectionToken = token<number>("connection");
    const container = Container.create();
    container
      .bind(connectionToken)
      .toDynamic(() => 1)
      .singleton()
      .onDeactivation(() => {
        called = true;
      });

    await container.unbindAsync(connectionToken);
    expect(called).toBe(false);
  });

  it("runs container-level onDeactivation handlers", async () => {
    const seen: Array<string> = [];
    const serviceToken = token<string>("service");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "instance")
      .singleton();
    container.onDeactivation(serviceToken, (instance) => {
      seen.push(instance);
    });

    container.resolve(serviceToken);
    await container.unbindAsync(serviceToken);
    expect(seen).toEqual(["instance"]);
  });
});

describe("deactivation on dispose", () => {
  it("runs @preDestroy on cached singletons during dispose", async () => {
    const events: Array<string> = [];
    @injectable()
    class Database {
      @preDestroy()
      close(): void {
        events.push("closed");
      }
    }
    const container = Container.create();
    container.bind(Database).toSelf().singleton();
    container.resolve(Database);

    await container.disposeAsync();
    expect(events).toEqual(["closed"]);
    expect(container.isDisposed).toBe(true);
  });

  it("runs each class's own @preDestroy when a teardown alternates between classes", () => {
    const events: Array<string> = [];
    class Cache {
      @preDestroy()
      flush(): void {
        events.push("cache.flush");
      }
    }
    class Pool {
      @preDestroy()
      drain(): void {
        events.push("pool.drain");
      }
    }
    const firstCache = token<Cache>("cache-a");
    const firstPool = token<Pool>("pool-a");
    const secondCache = token<Cache>("cache-b");
    const secondPool = token<Pool>("pool-b");
    const container = Container.create();
    container.bind(firstCache).to(Cache).singleton();
    container.bind(firstPool).to(Pool).singleton();
    container.bind(secondCache).to(Cache).singleton();
    container.bind(secondPool).to(Pool).singleton();
    container.resolve(firstCache);
    container.resolve(firstPool);
    container.resolve(secondCache);
    container.resolve(secondPool);

    container.unbindAll();
    expect(events).toEqual(["cache.flush", "pool.drain", "cache.flush", "pool.drain"]);
  });

  it("await using disposes the container and fires deactivation", async () => {
    const events: Array<string> = [];
    const serviceToken = token<string>("service");
    {
      await using container = Container.create();
      container
        .bind(serviceToken)
        .toDynamic(() => "live")
        .singleton()
        .onDeactivation((instance) => {
          events.push(`down:${instance}`);
        });
      container.resolve(serviceToken);
      expect(events).toEqual([]);
    }
    expect(events).toEqual(["down:live"]);
  });
});

describe("an async stage on a sync teardown", () => {
  /** A container whose cached `Service` returns a promise from the stage named `asyncStage`. */
  function containerWithStages(asyncStage: "container" | "binding" | "preDestroy"): {
    container: Container;
    service: ReturnType<typeof token<object>>;
    ran: Array<string>;
  } {
    const ran: Array<string> = [];
    const service = token<object>(`hk:Service-${asyncStage}`);
    const settle = (stage: string): Promise<void> | undefined => {
      ran.push(stage);
      return stage === asyncStage ? Promise.resolve() : undefined;
    };

    @injectable([])
    class Service {
      @preDestroy()
      close(): Promise<void> | undefined {
        return settle("preDestroy");
      }
    }
    const container = Container.create();
    container
      .bind(service)
      .to(Service)
      .singleton()
      .onDeactivation(() => settle("binding"));
    container.onDeactivation(service, () => settle("container"));
    container.resolve(service);
    return { container, service, ran };
  }

  it.each(["container", "binding", "preDestroy"] as const)(
    "runs every stage after an async %s stage, then throws once",
    (asyncStage) => {
      const { container, service, ran } = containerWithStages(asyncStage);

      expect(() => container.unbind(service)).toThrow(AsyncDeactivationError);
      expect(ran).toStrictEqual(["container", "binding", "preDestroy"]);
      expect(container.has(service)).toBe(false);
    },
  );

  it("runs every stage on unbindAll", () => {
    const { container, ran } = containerWithStages("container");

    expect(() => container.unbindAll()).toThrow(AsyncDeactivationError);
    expect(ran).toStrictEqual(["container", "binding", "preDestroy"]);
  });

  it("runs every stage on unload", () => {
    const ran: Array<string> = [];
    const service = token<object>("hk:ModuleService");

    @injectable([])
    class Service {
      @preDestroy()
      close(): void {
        ran.push("preDestroy");
      }
    }
    const feature = Module.create("hk:Feature", (builder) => {
      builder
        .bind(service)
        .to(Service)
        .singleton()
        .onDeactivation(async () => {
          ran.push("binding");
        });
    });
    const container = Container.fromModules(feature);
    container.resolve(service);

    expect(() => container.unload(feature)).toThrow(AsyncDeactivationError);
    expect(ran).toStrictEqual(["binding", "preDestroy"]);
    expect(container.has(service)).toBe(false);
  });
});
