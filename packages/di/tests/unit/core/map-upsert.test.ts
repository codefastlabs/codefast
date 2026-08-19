import { describe, expect, it, vi } from "vitest";

import { getOrInsert, getOrInsertComputed } from "#/core/map-upsert";

describe("getOrInsert", () => {
  it("stores and returns the fallback when the key is absent", () => {
    const map = new Map<string, Array<number>>();
    const inserted = getOrInsert(map, "a", [1]);
    expect(inserted).toEqual([1]);
    expect(map.get("a")).toBe(inserted);
  });

  it("returns the stored value and discards the fallback on a hit", () => {
    const stored = [1];
    const map = new Map<string, Array<number>>([["a", stored]]);
    const fallback: Array<number> = [2];
    expect(getOrInsert(map, "a", fallback)).toBe(stored);
    expect(map.get("a")).toBe(stored);
  });

  it("treats a stored null as present, since only undefined reads as absent", () => {
    const map = new Map<string, string | null>([["a", null]]);
    expect(getOrInsert(map, "a", "fallback")).toBeNull();
  });

  it("keys by the map's own equality, so NaN hits itself and 0 hits -0", () => {
    const map = new Map<number, string>();
    getOrInsert(map, Number.NaN, "nan");
    getOrInsert(map, 0, "zero");
    expect(getOrInsert(map, Number.NaN, "other")).toBe("nan");
    expect(getOrInsert(map, -0, "other")).toBe("zero");
    expect(map.size).toBe(2);
  });
});

describe("getOrInsertComputed", () => {
  it("calls the factory with the key exactly once on a miss", () => {
    const map = new Map<string, Array<number>>();
    const create = vi.fn((key: string) => [key.length]);
    expect(getOrInsertComputed(map, "abc", create)).toEqual([3]);
    expect(create).toHaveBeenCalledExactlyOnceWith("abc");
  });

  it("never calls the factory on a hit", () => {
    const stored = [1];
    const map = new Map<string, Array<number>>([["a", stored]]);
    const create = vi.fn(() => [2]);
    expect(getOrInsertComputed(map, "a", create)).toBe(stored);
    expect(create).not.toHaveBeenCalled();
  });

  it("lets the factory's own insertion stand as the returned identity", () => {
    const map = new Map<string, Array<number>>();
    const created = getOrInsertComputed(map, "a", () => {
      map.set("a", [99]);
      return [1];
    });
    expect(created).toEqual([1]);
    expect(map.get("a")).toBe(created);
  });

  it("propagates a throwing factory without inserting", () => {
    const map = new Map<string, Array<number>>();
    expect(() =>
      getOrInsertComputed(map, "a", () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(map.has("a")).toBe(false);
  });
});
