/**
 * A root-level `resolveAll` with no options memoizes its candidate list, and its value list when
 * every member is a hook-free constant, until any registry in the chain changes. These pin the
 * memo's boundaries: fresh arrays out, invalidation on bind and on hook registration, and no memo
 * for a nested read or a read carrying options.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";

const KIND_TAG = tag("kind");

function bindStrategies(container: Container, values: ReadonlyArray<number>, evaluated: Array<number>): void {
  for (const value of values) {
    container
      .bind(strategyToken)
      .toConstantValue(value)
      .when(() => {
        evaluated.push(value);
        return true;
      });
  }
}

const strategyToken = token<number>("collections-strategy");

describe("a root-level collection is memoized against the chain", () => {
  it("evaluates each predicate once across repeated reads and hands each read its own list", () => {
    const container = Container.create();
    const evaluated: Array<number> = [];
    bindStrategies(container, [1, 2, 3], evaluated);

    const first = container.resolveAll(strategyToken);
    const second = container.resolveAll(strategyToken);

    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(evaluated).toEqual([1, 2, 3]);

    // A caller that writes into its list rewrites nothing the next caller reads.
    (first as Array<number>).reverse();
    (first as Array<number>).push(99);
    expect(container.resolveAll(strategyToken)).toEqual([1, 2, 3]);
    expect(evaluated).toEqual([1, 2, 3]);
  });

  it("sees a binding added after the first read", () => {
    const container = Container.create();
    const evaluated: Array<number> = [];
    bindStrategies(container, [1, 2], evaluated);

    expect(container.resolveAll(strategyToken)).toEqual([1, 2]);

    bindStrategies(container, [3], evaluated);

    expect(container.resolveAll(strategyToken)).toEqual([1, 2, 3]);
  });

  it("drops a value memo once a container hook can change what a member resolves to", () => {
    const container = Container.create();
    bindStrategies(container, [1, 2], []);

    expect(container.resolveAll(strategyToken)).toEqual([1, 2]);

    container.onActivation(strategyToken, (_context, value) => value * 10);

    expect(container.resolveAll(strategyToken)).toEqual([10, 20]);
  });

  it("re-reads a parent's collection from a child after the parent rebinds", () => {
    const parent = Container.create();
    bindStrategies(parent, [1, 2], []);
    const child = parent.createChild();

    expect(child.resolveAll(strategyToken)).toEqual([1, 2]);

    bindStrategies(parent, [3], []);

    expect(child.resolveAll(strategyToken)).toEqual([1, 2, 3]);
  });

  it("memoizes candidates but not values when a member is not a constant", () => {
    const container = Container.create();
    let calls = 0;
    container
      .bind(strategyToken)
      .toDynamic(() => {
        calls += 1;
        return calls;
      })
      .when(() => true)
      .transient();
    container
      .bind(strategyToken)
      .toConstantValue(100)
      .when(() => true);

    expect(container.resolveAll(strategyToken)).toEqual([1, 100]);
    expect(container.resolveAll(strategyToken)).toEqual([2, 100]);
  });

  it("does not memoize a read that carries options or runs inside a factory", () => {
    const container = Container.create();
    const evaluated: Array<number> = [];
    bindStrategies(container, [1, 2], evaluated);
    container.bind(strategyToken).toConstantValue(7).whenTagged(KIND_TAG.of("extra"));
    const readerToken = token<number>("collections-reader");
    container
      .bind(readerToken)
      .toDynamic((context) => context.resolveAll(strategyToken).length)
      .transient();

    expect(container.resolveAll(strategyToken, { tags: [KIND_TAG.of("extra")] })).toEqual([7]);
    expect(container.resolve(readerToken)).toBe(3);
    expect(container.resolve(readerToken)).toBe(3);
    // Two nested reads, two evaluations per predicate: the memo is a root-level affair.
    expect(evaluated.filter((value) => value === 1)).toHaveLength(2);
  });
});

describe("a root collection of cached singleton members", () => {
  it("hands back the same instances on every read once the members are materialised", () => {
    let constructed = 0;

    @injectable()
    class Handler {
      readonly id = (constructed += 1);
    }

    const handlers = token<Handler>("collection-singleton-members");
    const container = Container.create();
    container.bind(handlers).to(Handler).many().singleton();
    container.bind(handlers).to(Handler).many().singleton();
    container.bind(handlers).to(Handler).many().singleton();

    const first = container.resolveAll(handlers);
    const second = container.resolveAll(handlers);
    const third = container.resolveAll(handlers);

    // The first read materialises the members; every read answers with the same instances in a list of its own.
    expect(constructed).toBe(3);
    expect(second).toEqual(first);
    expect(second[0]).toBe(first[0]);
    expect(third).toEqual(second);
    expect(third).not.toBe(second);
    expect(container.resolveAll(handlers)).toHaveLength(3);
  });

  it("sees a member rebound after the list settled", () => {
    @injectable()
    class Handler {}

    const handlers = token<Handler>("collection-singleton-rebound");
    const container = Container.create();
    container.bind(handlers).to(Handler).many().singleton();
    const kept = container.bind(handlers).to(Handler).many().singleton();

    const before = container.resolveAll(handlers);
    container.resolveAll(handlers);
    container.unbind(kept.id());
    container.bind(handlers).to(Handler).many().singleton();

    const after = container.resolveAll(handlers);
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });

  it("keeps materialising a member whose singleton is not cached yet", () => {
    let constructed = 0;

    @injectable()
    class Lazy {
      readonly id = (constructed += 1);
    }

    const members = token<unknown>("collection-mixed-members");
    const container = Container.create();
    container.bind(members).toConstantValue("constant").many();
    container.bind(members).to(Lazy).many().singleton();

    expect(container.resolveAll(members)).toEqual(["constant", expect.any(Lazy)]);
    expect(constructed).toBe(1);
    expect(container.resolveAll(members)[1]).toBe(container.resolveAll(members)[1]);
    expect(constructed).toBe(1);
  });

  it("settles the async twin the same way", async () => {
    @injectable()
    class Handler {}

    const handlers = token<Handler>("collection-singleton-async");
    const container = Container.create();
    container.bind(handlers).to(Handler).many().singleton();
    container.bind(handlers).to(Handler).many().singleton();

    const first = await container.resolveAllAsync(handlers);
    const second = await container.resolveAllAsync(handlers);
    const third = await container.resolveAllAsync(handlers);

    expect(second).toEqual(first);
    expect(second[1]).toBe(first[1]);
    expect(third).toEqual(second);
    expect(third).not.toBe(second);
  });
});
