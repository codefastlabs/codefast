/**
 * A constant's deactivation, which the resolver's plain-constant fast path used to swallow: the hook
 * ran only when an activation hook happened to sit beside it, so the same declaration answered
 * differently depending on an unrelated one.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { Module } from "#/core/module";
import { token } from "#/core/token";

describe("constant deactivation", () => {
  it("runs the hook on dispose with no activation hook beside it", async () => {
    const connectionToken = token<{ id: string }>("constant-dispose");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "only" })
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(connectionToken);

    await container.dispose();

    expect(closed).toEqual(["only"]);
  });

  it("runs the hook on unbind", () => {
    const connectionToken = token<{ id: string }>("constant-unbind");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "only" })
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(connectionToken);

    container.unbind(connectionToken);

    expect(closed).toEqual(["only"]);
  });

  it("runs the hook on unbindAll", () => {
    const connectionToken = token<{ id: string }>("constant-unbind-all");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "only" })
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(connectionToken);

    container.unbindAll();

    expect(closed).toEqual(["only"]);
  });

  // The value was handed in at bind time rather than built on demand, so nothing about the hook
  // depends on someone having asked for it.
  it("runs the hook for a value nothing ever resolved", async () => {
    const connectionToken = token<{ id: string }>("constant-unresolved");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "never-asked-for" })
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });

    await container.dispose();

    expect(closed).toEqual(["never-asked-for"]);
  });

  it("runs a container-level hook registered against the constant's token", async () => {
    const connectionToken = token<{ id: string }>("constant-container-hook");
    const closed: Array<string> = [];

    const container = Container.create();
    container.onDeactivation(connectionToken, (instance) => {
      closed.push(instance.id);
    });
    container.bind(connectionToken).toConstantValue({ id: "only" });
    container.resolve(connectionToken);

    await container.dispose();

    expect(closed).toEqual(["only"]);
  });

  // Two sweeps reach a constant now — the singleton cache and the registry — and an activated
  // constant sits in both.
  it("runs the hook once when an activation hook cached the value", async () => {
    const connectionToken = token<{ id: string }>("constant-activated-once");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "raw" })
      .onActivation((_ctx, instance) => ({ ...instance, id: `${instance.id}+activated` }))
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(connectionToken);

    await container.dispose();

    expect(closed).toEqual(["raw+activated"]);
  });

  it("hands the deactivation the activated value rather than the bound one", async () => {
    const connectionToken = token<{ id: string }>("constant-activated-value");
    const closed: Array<string> = [];

    const container = Container.create();
    container
      .bind(connectionToken)
      .toConstantValue({ id: "raw" })
      .onActivation((_ctx, instance) => ({ ...instance, id: "replaced" }))
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(connectionToken);

    await container.dispose();

    expect(closed).toEqual(["replaced"]);
  });

  it("runs the container-level hook before the binding's own", async () => {
    const connectionToken = token<{ id: string }>("constant-hook-order");
    const order: Array<string> = [];

    const container = Container.create();
    container.onDeactivation(connectionToken, () => {
      order.push("container");
    });
    container
      .bind(connectionToken)
      .toConstantValue({ id: "only" })
      .onDeactivation(() => {
        order.push("binding");
      });
    container.resolve(connectionToken);

    await container.dispose();

    expect(order).toEqual(["container", "binding"]);
  });

  it("runs the hook when the module that bound it is unloaded", () => {
    const connectionToken = token<{ id: string }>("constant-module-unload");
    const closed: Array<string> = [];

    const module = Module.create("constant-module", (builder) => {
      builder
        .bind(connectionToken)
        .toConstantValue({ id: "only" })
        .onDeactivation((instance) => {
          closed.push(instance.id);
        });
    });

    const container = Container.create();
    container.load(module);
    container.resolve(connectionToken);

    container.unload(module);

    expect(closed).toEqual(["only"]);
  });

  it("leaves a constant carrying no hook untouched", async () => {
    const plainToken = token<{ id: string }>("constant-no-hook");
    const hookedToken = token<{ id: string }>("constant-hooked");
    const closed: Array<string> = [];

    const container = Container.create();
    container.bind(plainToken).toConstantValue({ id: "plain" });
    container
      .bind(hookedToken)
      .toConstantValue({ id: "hooked" })
      .onDeactivation((instance) => {
        closed.push(instance.id);
      });
    container.resolve(plainToken);
    container.resolve(hookedToken);

    await container.dispose();

    expect(closed).toEqual(["hooked"]);
  });
});
