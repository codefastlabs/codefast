import { expectTypeOf } from "expect-type";
import { describe, it } from "vitest";

import { getOrInsert, getOrInsertComputed } from "#/core/map-upsert";

describe("map upsert value constraint", () => {
  it("infers key and value from the map alone", () => {
    const map = new Map<string, Array<number>>();
    expectTypeOf(getOrInsert(map, "a", [1])).toEqualTypeOf<Array<number>>();
    expectTypeOf(getOrInsertComputed(map, "a", () => [1])).toEqualTypeOf<Array<number>>();
    expectTypeOf(getOrInsertComputed<string, Array<number>>)
      .parameter(2)
      .parameter(0)
      .toEqualTypeOf<string>();
  });

  it("rejects a map whose value type admits undefined, which would read a hit as a miss", () => {
    const optional = new Map<string, number | undefined>();
    const unknownValued = new Map<string, unknown>();
    // @ts-expect-error — a stored `undefined` would be overwritten instead of returned.
    getOrInsert(optional, "a", 1);
    // @ts-expect-error — `unknown` admits `undefined`, so the same hazard applies.
    getOrInsertComputed(unknownValued, "a", () => 1);
    expectTypeOf(getOrInsert<string, number>)
      .parameter(0)
      .toEqualTypeOf<Map<string, number>>();
  });

  it("accepts null, which the absence test distinguishes from undefined", () => {
    const nullable = new Map<string, string | null>();
    expectTypeOf(getOrInsert(nullable, "a", null)).toEqualTypeOf<string | null>();
  });
});
