/**
 * `runWithContainer` is synchronous only: the ambient context is torn down when the callback's
 * synchronous run returns, so a callback returning a `Promise` is a mistake the return type flags by
 * resolving to `never`.
 */
import { describe, expectTypeOf, it } from "vitest";

import { Container, runWithContainer } from "#index";

describe("runWithContainer return type", () => {
  it("is the callback's value for a synchronous callback", () => {
    const container = Container.create();
    expectTypeOf(runWithContainer(container, () => 5)).toEqualTypeOf<number>();
    expectTypeOf(runWithContainer(container, () => "value")).toEqualTypeOf<string>();
  });

  it("is never for a callback that returns a promise", () => {
    const container = Container.create();
    expectTypeOf(runWithContainer(container, async () => 5)).toEqualTypeOf<never>();
    expectTypeOf(runWithContainer(container, () => Promise.resolve("later"))).toEqualTypeOf<never>();
  });
});
