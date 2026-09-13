/**
 * A root-level `resolveAll` with no options memoizes its candidate list, and its value list when
 * every member is a hook-free constant, until any registry in the chain changes. These pin the
 * memo's boundaries: fresh arrays out, invalidation on bind and on hook registration, and no memo
 * for a nested read or a read carrying options.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";

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
  it("evaluates each predicate once across repeated reads and hands out a fresh array every time", () => {
    const container = Container.create();
    const evaluated: Array<number> = [];
    bindStrategies(container, [1, 2, 3], evaluated);

    const first = container.resolveAll(strategyToken);
    const second = container.resolveAll(strategyToken);

    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual([1, 2, 3]);
    expect(second).not.toBe(first);
    expect(evaluated).toEqual([1, 2, 3]);

    first.push(99);

    expect(container.resolveAll(strategyToken)).toEqual([1, 2, 3]);
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
