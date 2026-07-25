/**
 * Registry-level removal semantics, reached through the container's public surface:
 * dropping every binding for a token in one pass, dropping a single binding by id, and the
 * slot summary a failed lookup reports back.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { NoMatchingBindingError } from "#/errors";
import { token } from "#/token";
import type { BindingIdentifier } from "#/types";

describe("removing every binding for a token", () => {
  it("drops each slot, including the named and tagged indexes", () => {
    const serviceToken = token<string>("registry-multi-slot");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    container.bind(serviceToken).toConstantValue("named").whenNamed("primary");
    container.bind(serviceToken).toConstantValue("tagged").whenTagged("env", "prod");

    expect(container.lookupBindings(serviceToken)).toHaveLength(3);

    container.unbind(serviceToken);

    expect(container.lookupBindings(serviceToken)).toHaveLength(0);
    expect(container.has(serviceToken)).toBe(false);
    // Every index is cleared, not just the default one.
    expect(container.resolveOptional(serviceToken, { name: "primary" })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tag: ["env", "prod"] })).toBeUndefined();
  });

  it("leaves other tokens untouched", () => {
    const removedToken = token<string>("registry-removed");
    const keptToken = token<string>("registry-kept");
    const container = Container.create();
    container.bind(removedToken).toConstantValue("gone");
    container.bind(keptToken).toConstantValue("stays");

    container.unbind(removedToken);

    expect(container.has(removedToken)).toBe(false);
    expect(container.resolve(keptToken)).toBe("stays");
  });

  it("is a no-op for a token that was never bound", () => {
    const container = Container.create();
    expect(() => container.unbind(token<string>("registry-never-bound"))).not.toThrow();
  });
});

describe("removing a single binding by id", () => {
  it("keeps the token's remaining slots and their indexes usable", () => {
    const serviceToken = token<string>("registry-by-id");
    const container = Container.create();
    const named = container.bind(serviceToken).toConstantValue("named").whenNamed("primary");
    container.bind(serviceToken).toConstantValue("tagged").whenTagged("env", "prod");

    container.unbind(named.id());

    expect(container.resolveOptional(serviceToken, { name: "primary" })).toBeUndefined();
    expect(container.resolve(serviceToken, { tag: ["env", "prod"] })).toBe("tagged");
    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
  });

  it("drops the token entirely once its last binding is removed", () => {
    const serviceToken = token<string>("registry-last-binding");
    const container = Container.create();
    const only = container.bind(serviceToken).toConstantValue("only").whenNamed("solo");

    container.unbind(only.id());

    expect(container.has(serviceToken)).toBe(false);
  });

  it("is a no-op for an unknown binding id", () => {
    const container = Container.create();
    expect(() => container.unbind("no-such-binding-id" as BindingIdentifier)).not.toThrow();
  });
});

describe("failed lookups report the slots that do exist", () => {
  it("lists each registered slot on the error", () => {
    const serviceToken = token<string>("registry-slot-summary");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("named").whenNamed("primary");
    container.bind(serviceToken).toConstantValue("tagged").whenTagged("env", "prod");

    let thrown: unknown;
    try {
      container.resolve(serviceToken, { name: "missing" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NoMatchingBindingError);
    const slots = (thrown as NoMatchingBindingError).availableSlots;
    expect(slots).toContain("name:primary");
    expect(slots.some((slot) => slot.includes("env=prod"))).toBe(true);
  });
});
