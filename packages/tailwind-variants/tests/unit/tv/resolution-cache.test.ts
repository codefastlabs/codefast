import { describe, expect, test } from "vitest";

import { tv } from "#index";

describe("resolution cache", () => {
  test("answers a repeated selection with the same slot resolvers once the plan is compiled", () => {
    const card = tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { lg: { base: "max-w-lg" }, sm: { base: "max-w-sm" } } },
    });

    // The first call resolves the configuration directly and is not remembered; the plan compiles
    // on the second call, and from then on a repeated selection is answered from the store.
    const first = card({ size: "sm" });
    const second = card({ size: "sm" });

    expect(first).not.toBe(second);
    expect(first.base()).toBe(second.base());
    expect(card({ size: "sm" })).toBe(second);
    expect(card({ size: "sm" })).not.toBe(card({ size: "lg" }));
  });

  test("keeps every selection resolving to what it resolved without a cache", () => {
    const options = { size: { lg: "px-8", sm: "px-2" } };
    const cached = tv({ base: "flex", variants: options });
    const uncached = tv({ base: "flex", variants: options }, { cacheResolutions: false });

    for (const size of ["sm", "lg", "unknown", undefined]) {
      for (let pass = 0; pass < 3; pass++) {
        expect(cached({ size } as never)).toBe(uncached({ size } as never));
      }
    }
  });

  test("separates a caller's own classes from the selection", () => {
    const button = tv({ base: "px-4", variants: { size: { sm: "px-2" } } });

    expect(button({ size: "sm" })).toBe("px-2");
    expect(button({ className: "px-6", size: "sm" })).toBe("px-6");
    expect(button({ size: "sm" })).toBe("px-2");
    expect(button({ class: "px-8", size: "sm" })).toBe("px-8");
  });

  test("does not cache a clsx-shaped class value, which the key cannot carry", () => {
    const button = tv({ base: "px-4", variants: { size: { sm: "px-2" } } });

    expect(button({ className: ["px-6", { "py-1": true }], size: "sm" })).toBe("px-6 py-1");
    expect(button({ className: ["px-6", { "py-1": false }], size: "sm" })).toBe("px-6");
  });

  test("distinguishes a boolean from the string that shares its group key", () => {
    const toggle = tv({
      base: "block",
      compoundVariants: [{ class: "ring", pressed: true }],
      variants: { pressed: { false: "opacity-50", true: "opacity-100" } },
    });

    expect(toggle({ pressed: true })).toBe("block opacity-100 ring");
    expect(toggle({ pressed: "true" } as never)).toBe("block opacity-100");
  });

  // The types reject this shape — a call could never satisfy the condition — but a JavaScript
  // caller, or a hand-merged configuration, still reaches the runtime with it.
  test("keys a compound on a variant the configuration never declares", () => {
    const badge = tv({
      base: "block",
      compoundVariants: [{ class: "text-red-500", ghost: true, size: "sm" }],
      variants: { size: { md: "p-4", sm: "p-2" } },
    } as never) as (props?: Record<string, unknown>) => string | undefined;

    expect(badge({ ghost: true, size: "sm" })).toBe("block p-2 text-red-500");
    expect(badge({ size: "sm" })).toBe("block p-2");
    expect(badge({ ghost: false, size: "sm" })).toBe("block p-2");
  });

  test("does not mistake an inherited key for an already-assigned id", () => {
    const config = { base: "block", variants: { size: { md: "p-4", sm: "p-2" } } };
    const cached = tv(config);
    const uncached = tv(config, { cacheResolutions: false });

    for (const size of ["toString", "constructor", "hasOwnProperty", "valueOf"]) {
      expect(cached({ size } as never)).toBe(uncached({ size } as never));
    }
  });

  test("keeps resolving a compound-tested variant across many distinct values", () => {
    const chip = tv({
      base: "block",
      compoundVariants: [{ class: "ring", tone: "t1" }],
      variants: { tone: { t1: "p-1" } },
    });

    for (let index = 0; index < 40; index++) {
      expect(chip({ tone: `t${String(index)}` } as never)).toBe(index === 1 ? "block p-1 ring" : "block");
    }

    expect(chip({ tone: "t1" } as never)).toBe("block p-1 ring");
  });

  test("answers an explicitly passed default from the entry an omitted one filled", () => {
    const merged: Array<string> = [];
    const button = tv(
      {
        base: "px-4",
        compoundVariants: [{ class: "ring", size: "md", tone: "accent" }],
        defaultVariants: { size: "md", tone: "plain" },
        variants: { size: { md: "px-6", sm: "px-2" }, tone: { accent: "text-accent", plain: "" } },
      },
      {
        twMerge: (classes) => {
          merged.push(classes);

          return classes;
        },
      },
    );

    expect(button({})).toBe("px-4 px-6");
    expect(button({})).toBe("px-4 px-6");
    expect(button({ size: "md", tone: "plain" })).toBe("px-4 px-6");
    expect(button({ size: "md", tone: "plain" })).toBe("px-4 px-6");
    expect(button({ tone: "accent" })).toBe("px-4 px-6 text-accent ring");
    expect(button({ size: "md", tone: "accent" })).toBe("px-4 px-6 text-accent ring");
    // A component without slots resolves its first two calls cold, so the store holds what the third merged.
    expect(merged).toEqual(["px-4 px-6", "px-4 px-6", "px-4 px-6", "px-4 px-6 text-accent ring"]);
  });

  test("keeps a falsy default apart from an omitted variant on the slot lane", () => {
    const slotsTv = tv as (
      configuration: object,
      options?: object,
    ) => (props?: Record<string, unknown>) => Record<string, () => string | undefined>;
    const configuration = {
      defaultVariants: { level: 0 },
      slots: { base: "block" },
      variants: { level: { 0: { base: "p-0" }, 1: { base: "p-1" } } },
    };
    const card = slotsTv(configuration);
    const uncached = slotsTv(configuration, { cacheResolutions: false });

    for (const props of [{}, { level: 0 }, {}, { level: 0 }, { level: 1 }]) {
      expect(card(props).base?.()).toBe(uncached(props).base?.());
    }
  });
});

describe("resolution cache: what a remembered caller class weighs", () => {
  const values = Object.fromEntries(
    Array.from({ length: 100 }, (_, index) => [`v${String(index)}`, `p-${String(index)}`]),
  );
  const remembered = { a: "v0", b: "v0" };
  const MOST_SELECTIONS = 99 * 100;

  /** Whether `insertions` other selections push a selection out of the store, once it has met `classCount` classes. */
  const evicts = (classCount: number, insertions: number): boolean => {
    let merges = 0;
    const flatTv = tv as (configuration: object, options?: object) => (props?: Record<string, unknown>) => string;
    const grid = flatTv(
      { variants: { a: values, b: values } },
      {
        twMerge: (classes: string) => {
          merges++;

          return classes;
        },
      },
    );

    grid();
    grid();
    grid(remembered);

    for (let index = 0; index < classCount; index++) {
      grid({ ...remembered, className: `m-${String(index)}` });
      grid({ ...remembered, className: `m-${String(index)}` });
    }

    for (let index = 0; index < insertions; index++) {
      grid({ a: `v${String(1 + (index % 99))}`, b: `v${String(Math.floor(index / 99))}` });
    }

    merges = 0;
    grid(remembered);

    return merges > 0;
  };

  /** The fewest other selections that evict one, found by bisection: eviction only grows with them. */
  const evictionPoint = (classCount: number): number => {
    let low = 0;
    let high = MOST_SELECTIONS;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);

      if (evicts(classCount, middle)) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }

    return low;
  };

  test("charges a selection's remembered classes against the store's limit", () => {
    const light = evictionPoint(0);

    expect(light).toBeLessThan(MOST_SELECTIONS);
    expect(evictionPoint(40)).toBeLessThan(light);
  });
});
