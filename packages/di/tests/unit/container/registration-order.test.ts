/**
 * `resolveAll` returns a token's bindings in registration order, however a chain refines its own
 * binding after committing it — a refinement that re-slots it never moves it, or what it displaced
 * on the way, behind a binding registered later.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";

const FUEL = tag("ro:fuel");
const SIZE = tag("ro:size");

describe("resolveAll registration order", () => {
  it("keeps a default binding ahead of a named one registered after it", () => {
    const service = token<string>("ro:DefaultThenNamed");
    const container = Container.create();
    container.bind(service).toConstantValue("A");
    container.bind(service).toConstantValue("B").whenNamed("x");

    expect(container.resolveAll(service)).toStrictEqual(["A", "B"]);
    expect(container.resolve(service)).toBe("A");
  });

  it("keeps a smaller tag set ahead of a larger one registered after it", () => {
    const service = token<string>("ro:TagSets");
    const container = Container.create();
    container.bind(service).toConstantValue("A").whenTagged(FUEL.of("petrol"));
    container.bind(service).toConstantValue("B").whenTagged(FUEL.of("petrol")).whenTagged(SIZE.of("v8"));

    expect(container.resolveAll(service)).toStrictEqual(["A", "B"]);
  });

  it("keeps a default binding ahead of a member and a predicate binding registered after it", () => {
    const service = token<string>("ro:DefaultThenMemberThenPredicate");
    const container = Container.create();
    container.bind(service).toConstantValue("A");
    container.bind(service).toConstantValue("B").many();
    container
      .bind(service)
      .toConstantValue("C")
      .when(() => true);

    expect(container.resolveAll(service)).toStrictEqual(["A", "B", "C"]);
  });

  it("keeps a chain's binding in place when the chain is refined after later registrations", () => {
    const service = token<string>("ro:LateRefinement");
    const container = Container.create();
    const first = container.bind(service).toConstantValue("A").whenNamed("a");
    container.bind(service).toConstantValue("B").whenNamed("b");
    first.whenTagged(FUEL.of("petrol"));

    expect(container.resolveAll(service)).toStrictEqual(["A", "B"]);
  });

  it("orders the async lane and the lookup snapshot the same way", async () => {
    const service = token<string>("ro:AsyncAndSnapshot");
    const container = Container.create();
    container.bind(service).toConstantValue("A");
    container.bind(service).toConstantValue("B").whenNamed("x");

    await expect(container.resolveAllAsync(service)).resolves.toStrictEqual(["A", "B"]);
    expect(container.lookupBindings(service)?.map((binding) => binding.slot.name)).toStrictEqual([undefined, "x"]);
  });
});
