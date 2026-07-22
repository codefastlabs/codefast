/**
 * Deactivation-side lifecycle semantics: binding-level and container-level
 * handlers plus @preDestroy, across unbind and dispose.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectable } from "#/decorators/injectable";
import { preDestroy } from "#/decorators/lifecycle-decorators";
import { token } from "#/token";

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
