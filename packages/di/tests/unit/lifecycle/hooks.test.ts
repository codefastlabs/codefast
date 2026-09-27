/**
 * Deactivation-side lifecycle semantics: binding-level and container-level
 * handlers plus `@preDestroy`, across unbind and dispose.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { preDestroy } from "#decorators/lifecycle";

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

    await container.dispose();
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
