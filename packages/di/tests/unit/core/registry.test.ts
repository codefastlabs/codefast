/**
 * Registry-level removal semantics, reached through the container's public surface:
 * dropping every binding for a token in one pass, dropping a single binding by id, and the
 * slot summary a failed lookup reports back.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";
import type { BindingIdentifier } from "#/core/types";
import { NoMatchingBindingError, RebindUnboundTokenError } from "#/errors/errors";

const ENV_TAG = tag("env");

describe("removing every binding for a token", () => {
  it("drops each slot, including the named and tagged indexes", () => {
    const serviceToken = token<string>("registry-multi-slot");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    container.bind(serviceToken).toConstantValue("named").whenNamed("primary");
    container.bind(serviceToken).toConstantValue("tagged").whenTagged(ENV_TAG.of("prod"));

    expect(container.lookupBindings(serviceToken)).toHaveLength(3);

    container.unbind(serviceToken);

    expect(container.lookupBindings(serviceToken)).toHaveLength(0);
    expect(container.has(serviceToken)).toBe(false);
    // Every index is cleared, not just the default one.
    expect(container.resolveOptional(serviceToken, { name: "primary" })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tag: ENV_TAG.of("prod") })).toBeUndefined();
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
    container.bind(serviceToken).toConstantValue("tagged").whenTagged(ENV_TAG.of("prod"));

    container.unbind(named.id());

    expect(container.resolveOptional(serviceToken, { name: "primary" })).toBeUndefined();
    expect(container.resolve(serviceToken, { tag: ENV_TAG.of("prod") })).toBe("tagged");
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
    container.bind(serviceToken).toConstantValue("tagged").whenTagged(ENV_TAG.of("prod"));

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

describe("the id index is built on first use and kept in step afterwards", () => {
  it("answers an id-keyed unbind after many token-keyed binds", () => {
    const container = Container.create();
    const tokens = Array.from({ length: 16 }, (_value, index) => token<number>(`registry-lazy-${String(index)}`));
    const chains = tokens.map((each, index) => container.bind(each).toConstantValue(index));

    container.unbind(chains[7]!.id());

    expect(container.has(tokens[7]!)).toBe(false);
    expect(container.resolve(tokens[8]!)).toBe(8);
  });

  it("sees a binding added after the first id-keyed operation", () => {
    const first = token<number>("registry-lazy-first");
    const second = token<number>("registry-lazy-second");
    const container = Container.create();
    const firstChain = container.bind(first).toConstantValue(1);
    container.unbind(firstChain.id());
    const secondChain = container.bind(second).toConstantValue(2);

    container.unbind(secondChain.id());

    expect(container.has(second)).toBe(false);
  });

  it("forgets a displaced binding's id once last-wins replaced it", () => {
    const serviceToken = token<number>("registry-lazy-displaced");
    const container = Container.create();
    const displaced = container.bind(serviceToken).toConstantValue(1);
    container.bind(serviceToken).toConstantValue(2);

    expect(() => container.unbind(displaced.id())).not.toThrow();
    expect(container.resolve(serviceToken)).toBe(2);
  });
});

describe("a token nobody bound", () => {
  it("reports no bindings without allocating a list the caller could mutate", () => {
    const container = Container.create();
    const unbound = token<number>("registry-unbound");

    expect(container.lookupBindings(unbound)).toEqual([]);
    expect(container.has(unbound)).toBe(false);
  });

  it("tears down, rebinds and inspects a container that never bound anything", () => {
    const container = Container.create();
    const unbound = token<number>("registry-never-bound");

    expect(() => {
      container.unbindAll();
    }).not.toThrow();
    expect(container.inspect().ownBindings).toEqual([]);
    expect(() => container.rebind(unbound)).toThrow(RebindUnboundTokenError);
    expect(container.resolveOptional(unbound)).toBeUndefined();

    container.bind(unbound).toConstantValue(1);

    expect(container.resolve(unbound)).toBe(1);
  });
});

describe("a lone default-slot binding and the record it grows into", () => {
  it("keeps the default binding resolvable when a tagged slot joins the token", () => {
    const serviceToken = token<string>("registry-lone-promote");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    container.bind(serviceToken).toConstantValue("prod").whenTagged(ENV_TAG.of("prod"));

    expect(container.lookupBindings(serviceToken)).toHaveLength(2);
    expect(container.resolve(serviceToken)).toBe("default");
    expect(container.resolve(serviceToken, { tags: [ENV_TAG.of("prod")] })).toBe("prod");
  });

  it("goes back to a lone binding once the record shrinks to the default slot", () => {
    const serviceToken = token<string>("registry-lone-demote");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    const tagged = container.bind(serviceToken).toConstantValue("prod").whenTagged(ENV_TAG.of("prod"));

    container.unbind(tagged.id());

    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
    expect(container.resolve(serviceToken)).toBe("default");
    expect(() => container.resolve(serviceToken, { tags: [ENV_TAG.of("prod")] })).toThrow(NoMatchingBindingError);

    // The token can grow a record again after it went back to being lone.
    container.bind(serviceToken).toConstantValue("staging").whenTagged(ENV_TAG.of("staging"));

    expect(container.resolve(serviceToken, { tags: [ENV_TAG.of("staging")] })).toBe("staging");
    expect(container.resolve(serviceToken)).toBe("default");
  });

  it("lets a later default-slot binding take the lone seat under last-wins", () => {
    const serviceToken = token<string>("registry-lone-last-wins");
    const container = Container.create();
    const first = container.bind(serviceToken).toConstantValue("first");
    container.bind(serviceToken).toConstantValue("second");

    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
    expect(container.resolve(serviceToken)).toBe("second");
    // The displaced binding's id is gone with it.
    expect(() => container.unbind(first.id())).not.toThrow();
    expect(container.resolve(serviceToken)).toBe("second");
  });

  it("keeps a predicate binding beside the default one instead of displacing it", () => {
    const serviceToken = token<string>("registry-lone-predicate");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    const guarded = container
      .bind(serviceToken)
      .toConstantValue("guarded")
      .when(() => false);

    expect(container.lookupBindings(serviceToken)).toHaveLength(2);
    expect(container.resolve(serviceToken)).toBe("default");

    container.unbind(guarded.id());

    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
    expect(container.resolve(serviceToken)).toBe("default");
  });

  it("removes a whole token whether it is lone or keeps a record", () => {
    const loneToken = token<string>("registry-lone-remove");
    const recordToken = token<string>("registry-record-remove");
    const container = Container.create();
    container.bind(loneToken).toConstantValue("lone");
    container.bind(recordToken).toConstantValue("a").whenNamed("a");
    container.bind(recordToken).toConstantValue("b").whenNamed("b");

    container.unbind(loneToken);
    container.unbind(recordToken);

    expect(container.has(loneToken)).toBe(false);
    expect(container.has(recordToken)).toBe(false);
    expect(container.inspect().ownBindings).toEqual([]);
  });
});
