/**
 * Registry-level removal semantics, reached through the container's public surface:
 * dropping every binding for a token in one pass, dropping a single binding by id, and the
 * slot summary a failed lookup reports back.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { BindingRegistration } from "#container/binding-builders";
import { BindingChain } from "#container/binding-builders";
import { Container } from "#container/container";
import { BindingRegistry } from "#core/registry";
import { tag } from "#core/tag";
import { token } from "#core/token";
import type { BindingIdentifier } from "#core/types";
import { NoMatchingBindingError, RebindUnboundTokenError } from "#errors/errors";
import { ScopeManager } from "#lifecycle/scope-manager";

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
    expect(() => container.unbind(-1 as BindingIdentifier)).not.toThrow();
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

describe("last-wins displacement inside a record is answered by slot index", () => {
  const TIER_TAG = tag("tier");

  it("displaces the default occupant even while collection members share the token", () => {
    const serviceToken = token<string>("registry-default-among-members");
    const container = Container.create();
    // The member forms the record first, so the default binding lands in it rather than the lone seat.
    container.bind(serviceToken).toConstantValue("member").many();
    container.bind(serviceToken).toConstantValue("first");
    container.bind(serviceToken).toConstantValue("second");

    // The member is untouched; the second default binding took the first's slot through the index.
    expect(container.resolve(serviceToken)).toBe("second");
    expect(container.resolveAll(serviceToken)).toContain("member");
    expect(container.lookupBindings(serviceToken)).toHaveLength(2);
  });

  it("frees the default slot when its occupant becomes a member in place", () => {
    const serviceToken = token<string>("registry-default-turns-member");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("member").many();
    const wasDefault = container.bind(serviceToken).toConstantValue("was-default");

    wasDefault.many();
    // The next default binding must not resurrect the now-member's freed slot as a displacement.
    container.bind(serviceToken).toConstantValue("fresh");

    expect(container.resolve(serviceToken)).toBe("fresh");
    expect(container.resolveAll(serviceToken)).toContain("was-default");
    expect(container.lookupBindings(serviceToken)).toHaveLength(3);
  });

  it("frees the default slot when its occupant gains a predicate in place", () => {
    const serviceToken = token<string>("registry-default-turns-predicate");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("member").many();
    const wasDefault = container.bind(serviceToken).toConstantValue("was-default");

    wasDefault.when(() => false);
    container.bind(serviceToken).toConstantValue("fresh");

    // `fresh` holds the default slot; the predicate binding stays, guarded off, never displaced.
    expect(container.resolve(serviceToken)).toBe("fresh");
    expect(container.lookupBindings(serviceToken)).toHaveLength(3);
  });

  it("displaces a two-criterion slot in either declaration order", () => {
    const serviceToken = token<string>("registry-two-criterion-last-wins");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("first").whenNamed("primary").whenTagged(TIER_TAG.of("gold"));
    container.bind(serviceToken).toConstantValue("second").whenTagged(TIER_TAG.of("gold")).whenNamed("primary");

    expect(container.resolve(serviceToken, { name: "primary", tags: [TIER_TAG.of("gold")] })).toBe("second");
    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
  });

  it("frees the default slot when a slow reslot moves its occupant onto a tag", () => {
    const serviceToken = token<string>("registry-default-slow-reslot");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("member").many();
    const wasDefault = container.bind(serviceToken).toConstantValue("was-default");

    // whenTagged always goes through the re-slot path, not the in-place fast path setMany/when() take.
    wasDefault.whenTagged(TIER_TAG.of("gold"));
    container.bind(serviceToken).toConstantValue("fresh");

    expect(container.resolve(serviceToken)).toBe("fresh");
    expect(container.resolve(serviceToken, { tags: [TIER_TAG.of("gold")] })).toBe("was-default");
    expect(container.resolveAll(serviceToken)).toContain("member");
  });

  it("re-indexes a displaced default binding restored when a member takes the token", () => {
    const serviceToken = token<string>("registry-default-restore");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("first-default");
    // The member's own registration displaces the lone default, then membership restores it.
    container.bind(serviceToken).toConstantValue("member").many();

    expect(container.resolve(serviceToken)).toBe("first-default");
    expect(container.resolveAll(serviceToken)).toContain("member");

    // The restore re-indexed the default, so a later default displaces it instead of coexisting.
    container.bind(serviceToken).toConstantValue("second-default");

    expect(container.resolve(serviceToken)).toBe("second-default");
    expect(container.lookupBindings(serviceToken)).toHaveLength(2);
  });

  it("displaces a three-criterion slot declared in a different order", () => {
    const serviceToken = token<string>("registry-three-criterion");
    const alpha = tag("alpha");
    const beta = tag("beta");
    const gamma = tag("gamma");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("first")
      .whenTagged(alpha.of("1"))
      .whenTagged(beta.of("2"))
      .whenTagged(gamma.of("3"));
    container
      .bind(serviceToken)
      .toConstantValue("second")
      .whenTagged(gamma.of("3"))
      .whenTagged(alpha.of("1"))
      .whenTagged(beta.of("2"));

    expect(container.resolve(serviceToken, { tags: [alpha.of("1"), beta.of("2"), gamma.of("3")] })).toBe("second");
    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
  });
});

describe("the version is a strictly increasing count of mutations", () => {
  // Every version-stamped memo in the engine compares a sum of registry versions across a chain for
  // equality, which is sound only while each version can never take a value it already took.
  it("rises on every mutation the registry accepts, in any order", () => {
    const tokens = [token<string>("mono-a"), token<string>("mono-b")];
    const criterion = ENV_TAG.of("mono");

    expect(() => {
      fc.assert(
        fc.property(fc.array(fc.tuple(fc.nat(8), fc.nat(64)), { maxLength: 40 }), (steps) => {
          const registry = new BindingRegistry();
          const scope = new ScopeManager();
          const registration: BindingRegistration = { registry, scope, moduleBindingIds: undefined };
          const chains: Array<BindingChain<string>> = [];
          let previous = registry.version;

          const expectRose = (what: string): void => {
            if (registry.version <= previous) {
              throw new Error(`${what}: version ${String(registry.version)} did not rise past ${String(previous)}`);
            }
            previous = registry.version;
          };
          // A refinement on a chain the registry no longer holds is inert by contract, so it moves nothing.
          const liveChain = (pick: number): BindingChain<string> | undefined => {
            const chain = chains[pick % Math.max(chains.length, 1)];
            return chain !== undefined && registry.getById(chain.identifier) === chain ? chain : undefined;
          };

          for (const [operation, pick] of steps) {
            switch (operation) {
              case 0: {
                const chain = new BindingChain<string>(tokens[pick % tokens.length]!, registration);
                chain.toConstantValue(`v${String(pick)}`);
                chains.push(chain);
                expectRose("bind");
                break;
              }
              case 1: {
                const chain = liveChain(pick);
                if (chain !== undefined && !chain.isMany) {
                  chain.whenTagged(criterion);
                  expectRose("whenTagged");
                }
                break;
              }
              case 2: {
                const chain = liveChain(pick);
                if (chain !== undefined) {
                  chain.when(() => true);
                  expectRose("when");
                }
                break;
              }
              case 3: {
                const chain = liveChain(pick);
                if (chain !== undefined && chain.slot.tags.length === 0 && !chain.isMany) {
                  chain.many();
                  expectRose("many");
                }
                break;
              }
              case 4: {
                const chain = liveChain(pick);
                if (chain !== undefined) {
                  chain.onActivation((_ctx, instance) => instance);
                  expectRose("onActivation");
                }
                break;
              }
              case 5:
                registry.removeByToken(tokens[pick % tokens.length]!);
                expectRose("removeByToken");
                break;
              case 6: {
                const chain = chains[pick % Math.max(chains.length, 1)];
                if (chain !== undefined && registry.removeById(chain.identifier) !== undefined) {
                  expectRose("removeById");
                }
                break;
              }
              case 7:
                registry.clear();
                expectRose("clear");
                break;
              default:
                registry.touch();
                expectRose("touch");
            }
          }
        }),
        { numRuns: 200 },
      );
    }).not.toThrow();
  });
});
