/**
 * `validate()` on container-level hooks: they are keyed by token identity, so a class that is only a
 * `to()` target matches nothing and the hook silently never runs. Registering before binding stays a
 * supported order, so the check belongs here rather than at registration.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { UnreachableLifecycleHookError } from "#/errors/errors";

class Connection {
  readonly id = "connection";
}

describe("container.validate() — container-level lifecycle hooks", () => {
  it("throws when a deactivation hook is keyed by the class but the binding is keyed by a token", () => {
    const connectionToken = token<Connection>("mismatch-deactivation");

    const container = Container.create();
    container.bind(connectionToken).to(Connection).singleton();
    container.onDeactivation(Connection, () => {
      // never reached — the binding is keyed by the token, not the class
    });

    expect(() => {
      container.validate();
    }).toThrow(UnreachableLifecycleHookError);
  });

  it("names the token and the phase that registered the hook", () => {
    const connectionToken = token<Connection>("mismatch-named");

    const container = Container.create();
    container.bind(connectionToken).to(Connection).singleton();
    container.onActivation(Connection, (_ctx, instance) => instance);

    let caught: unknown;
    try {
      container.validate();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UnreachableLifecycleHookError);
    expect((caught as UnreachableLifecycleHookError).tokenName).toBe("Connection");
    expect((caught as UnreachableLifecycleHookError).phase).toBe("onActivation");
    expect((caught as UnreachableLifecycleHookError).code).toBe("UNREACHABLE_LIFECYCLE_HOOK");
  });

  it("throws for a hook on a token nothing was ever bound to", () => {
    const boundToken = token<Connection>("bound");
    const strayToken = token<Connection>("stray");

    const container = Container.create();
    container.bind(boundToken).to(Connection).singleton();
    container.onDeactivation(strayToken, () => {
      // never reached
    });

    expect(() => {
      container.validate();
    }).toThrow(/'stray'/);
  });

  // Registering before binding is how the existing suite wires hooks, so it must stay valid.
  it("accepts a hook registered before its binding", () => {
    const connectionToken = token<Connection>("hook-first");

    const container = Container.create();
    container.onDeactivation(connectionToken, () => {
      // reached on dispose
    });
    container.bind(connectionToken).to(Connection).singleton();

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  it("accepts a hook keyed by a class the container binds to itself", () => {
    const container = Container.create();
    container.bind(Connection).toSelf().singleton();
    container.onDeactivation(Connection, () => {
      // reached on dispose
    });

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  // The child resolves through the parent, so a parent-owned binding is reachable from here.
  it("accepts a hook on a child for a token bound in the parent", () => {
    const connectionToken = token<Connection>("parent-owned");

    const parent = Container.create();
    parent.bind(connectionToken).to(Connection).singleton();
    const child = parent.createChild();
    child.onDeactivation(connectionToken, () => {
      // the parent owns the instance, but the token is reachable from the child
    });

    expect(() => {
      child.validate();
    }).not.toThrow();
  });

  it("accepts a container with no container-level hooks at all", () => {
    const connectionToken = token<Connection>("no-hooks");

    const container = Container.create();
    container.bind(connectionToken).to(Connection).singleton();

    expect(() => {
      container.validate();
    }).not.toThrow();
  });
});
