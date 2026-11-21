import { describe, expect, test } from "vitest";

import type { ResolutionCache } from "#resolve/cache";
import { createResolutionCache } from "#resolve/cache";

/** Entries one generation holds; the store retires it on the first entry past this. */
const LIMIT = 2048;

/** Stores keys `0` through `LIMIT`, one past a full generation, so the store retires them all. */
const fillAndRetire = <Value>(cache: ResolutionCache<Value>, valueOf: (key: number) => Value): void => {
  for (let key = 0; key <= LIMIT; key++) {
    cache.set(key, valueOf(key));
  }
};

describe("createResolutionCache", () => {
  test("answers a key from the retired generation and keeps it", () => {
    const cache = createResolutionCache<string>();

    fillAndRetire(cache, (key) => `value-${String(key)}`);

    expect(cache.get(0)).toBe("value-0");
    expect(cache.get(LIMIT)).toBe(`value-${String(LIMIT)}`);
  });

  test("retires a generation that promotions alone fill", () => {
    const cache = createResolutionCache<string>();

    fillAndRetire(cache, (key) => `value-${String(key)}`);
    cache.set("fresh", "fresh");

    // One stored entry plus a full generation of promotions overflows, so the generation the
    // promotions came from is dropped and the one key nobody re-read goes with it.
    for (let key = 0; key < LIMIT; key++) {
      expect(cache.get(key)).toBe(`value-${String(key)}`);
    }

    expect(cache.get(LIMIT)).toBeUndefined();
    expect(cache.get("fresh")).toBe("fresh");
    expect(cache.get(0)).toBe("value-0");
  });

  test("charges a promoted entry for what it holds inside", () => {
    const cache = createResolutionCache<{ readonly held: number }>((value) => value.held);

    fillAndRetire(cache, (key) => ({ held: key === 0 ? LIMIT - 1 : 0 }));
    cache.set("fresh", { held: 0 });

    // The heavy entry alone fills what the fresh generation has left, so promoting it retires that generation.
    expect(cache.get(0)).toEqual({ held: LIMIT - 1 });
    expect(cache.get(1)).toBeUndefined();
    expect(cache.get(0)).toEqual({ held: LIMIT - 1 });
    expect(cache.get("fresh")).toEqual({ held: 0 });
  });

  test("weighs a promoted entry as one when no weight is given", () => {
    const cache = createResolutionCache<{ readonly held: number }>();

    fillAndRetire(cache, (key) => ({ held: key === 0 ? LIMIT - 1 : 0 }));
    cache.set("fresh", { held: 0 });

    expect(cache.get(0)).toEqual({ held: LIMIT - 1 });
    expect(cache.get(1)).toEqual({ held: 0 });
  });
});
