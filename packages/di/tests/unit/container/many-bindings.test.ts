/**
 * `many()` makes a binding a collection member: `resolveAll` takes every member, `resolve` never
 * selects one, and membership replaces slot last-wins. These pin that contract and its two limits —
 * a member keeps the default slot, and a chain cannot mix the two.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import { ManyBindingSlotError, NoMatchingBindingError } from "#errors/errors";

const strategyToken = token<number>("many-strategy");
const KIND_TAG = tag("kind");

describe("many() bindings", () => {
  it("coexist on one token and all come back from resolveAll, in registration order", () => {
    const container = Container.create();
    container.bind(strategyToken).toConstantValue(1).many();
    container.bind(strategyToken).toConstantValue(2).many();
    container.bind(strategyToken).toConstantValue(3).many();

    expect(container.resolveAll(strategyToken)).toEqual([1, 2, 3]);
    expect(container.lookupBindings(strategyToken).map((snapshot) => snapshot.isMany)).toEqual([true, true, true]);
  });

  it("are never what a single resolve selects", () => {
    const container = Container.create();
    container.bind(strategyToken).toConstantValue(1).many();

    expect(() => container.resolve(strategyToken)).toThrow(NoMatchingBindingError);
    expect(container.resolveOptional(strategyToken)).toBeUndefined();
    expect(container.has(strategyToken)).toBe(true);
  });

  it("leave the default slot to an ordinary binding, which resolve picks and resolveAll still lists", () => {
    const container = Container.create();
    container.bind(strategyToken).toConstantValue(1).many();
    container.bind(strategyToken).toConstantValue(10);
    container.bind(strategyToken).toConstantValue(2).many();

    expect(container.resolve(strategyToken)).toBe(10);
    // `toConstantValue(2)` displaced the default binding for the instant before `many()` freed the
    // slot again; the restore re-registers it, so it follows the member — as it does after `whenNamed`.
    expect(container.resolveAll(strategyToken)).toEqual([1, 2, 10]);
  });

  it("neither displace nor are displaced under last-wins", () => {
    const container = Container.create();
    container.bind(strategyToken).toConstantValue(10);
    container.bind(strategyToken).toConstantValue(1).many();
    container.bind(strategyToken).toConstantValue(20);

    expect(container.resolve(strategyToken)).toBe(20);
    expect(container.resolveAll(strategyToken)).toEqual([1, 20]);
  });

  it("may carry a predicate, which resolveAll still honours", () => {
    const container = Container.create();
    container
      .bind(strategyToken)
      .toConstantValue(1)
      .many()
      .when(() => false);
    container.bind(strategyToken).toConstantValue(2).many();

    expect(container.resolveAll(strategyToken)).toEqual([2]);
  });

  it("keep the default slot: no name or tag on a member, and no membership on a slotted binding", () => {
    const container = Container.create();

    expect(() => container.bind(strategyToken).toConstantValue(1).many().whenNamed("a")).toThrow(ManyBindingSlotError);
    expect(() => container.bind(strategyToken).toConstantValue(2).whenTagged(KIND_TAG.of("x")).many()).toThrow(
      ManyBindingSlotError,
    );
  });

  it("can be unbound by id and by token like any other binding", () => {
    const container = Container.create();
    const first = container.bind(strategyToken).toConstantValue(1).many();
    container.bind(strategyToken).toConstantValue(2).many();

    container.unbind(first.id());

    expect(container.resolveAll(strategyToken)).toEqual([2]);

    container.unbind(strategyToken);

    expect(container.resolveAll(strategyToken)).toEqual([]);
    expect(container.has(strategyToken)).toBe(false);
  });

  it("are gathered through a child's parent walk and memoized like any root collection", () => {
    const parent = Container.create();
    parent.bind(strategyToken).toConstantValue(1).many();
    const child = parent.createChild();
    child.bind(strategyToken).toConstantValue(2).many();

    const first = child.resolveAll(strategyToken);
    const second = child.resolveAll(strategyToken);

    expect(first).toEqual([2, 1]);
    // The memo's own list, handed out as is while the chain is unchanged.
    expect(second).toBe(first);

    parent.bind(strategyToken).toConstantValue(3).many();

    expect(child.resolveAll(strategyToken)).toEqual([2, 1, 3]);
  });

  it("work for transient factories and async factories too", async () => {
    const factoryToken = token<number>("many-factory");
    const container = Container.create();
    let calls = 0;
    container
      .bind(factoryToken)
      .toDynamic(() => {
        calls += 1;
        return calls;
      })
      .many()
      .transient();
    container
      .bind(factoryToken)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        return 100;
      })
      .many();

    await expect(container.resolveAllAsync(factoryToken)).resolves.toEqual([1, 100]);
    await expect(container.resolveAllAsync(factoryToken)).resolves.toEqual([2, 100]);
  });
});
