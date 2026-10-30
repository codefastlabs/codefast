import { twMerge } from "cn";
import { twMerge as tailwindMerge } from "tailwind-merge";

import { tv } from "#index";
import { createClassDoor } from "#resolve/flat-selection";

type FlatResolver = (props?: Record<string, unknown>) => string | undefined;

const untypedTv = tv as (configuration: object, options?: object) => FlatResolver;

/** Bases whose own merge drops a class a caller's class can bring back, so a merged prefix would answer wrongly. */
const NON_TRANSITIVE = [
  { base: "slashed-zero normal-nums", className: "ordinal" },
  { base: "overflow-x-auto overflow-hidden", className: "line-clamp-2" },
  { base: "touch-pan-y touch-auto", className: "touch-pan-x" },
] as const;

const CLASSES = [
  "px-2",
  "px-4 py-1",
  "text-sm",
  "text-lg font-bold",
  "bg-red-500",
  "ordinal",
  "line-clamp-2",
  "touch-pan-x",
  "rounded-none rounded-md",
  "",
];

/** A deterministic pseudo-random sequence, so a failing draw reproduces. */
const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state / 2_147_483_648;
  };
};

describe("a caller's class on a remembered selection", () => {
  test.each(NON_TRANSITIVE)("merges the whole text when a merge dropped more than repeats: $base", (example) => {
    const button = untypedTv({ base: example.base, variants: { size: { sm: "text-sm" } } });

    // Enough other classes first that the selection settles what it merges a caller's class onto.
    for (const filler of ["m-1", "m-2", "m-3", "m-4", "m-5", "m-6"]) {
      expect(button({ className: filler })).toBe(tailwindMerge(`${example.base} ${filler}`));
    }

    for (let call = 0; call < 5; call++) {
      expect(button({ className: example.className })).toBe(tailwindMerge(`${example.base} ${example.className}`));
    }
  });

  test("answers every drawn call as a resolver without a cache does, through every sighting", () => {
    const configuration = {
      base: "flex px-4 px-4 overflow-x-auto overflow-hidden",
      compoundVariants: [{ class: "touch-pan-y touch-auto", size: "lg", tone: "accent" }],
      defaultVariants: { size: "md" },
      variants: {
        size: { lg: "px-8 text-lg", md: "px-4", sm: "px-2 text-sm text-sm" },
        tone: { accent: "bg-accent slashed-zero normal-nums", plain: "" },
      },
    };
    const random = createRandom(9);
    const pick = <Value>(values: ReadonlyArray<Value>): Value => values[Math.floor(random() * values.length)] as Value;

    for (const options of [{}, { twMerge: false }, { twMerge: (classes: string) => tailwindMerge(classes) }]) {
      const cached = untypedTv(configuration, options);
      const uncached = untypedTv(configuration, { ...options, cacheResolutions: false });

      for (let call = 0; call < 3000; call++) {
        const props = {
          className: pick(CLASSES),
          size: pick(["sm", "md", "lg", undefined]),
          tone: pick(["accent", "plain", undefined]),
        };

        expect(cached(props)).toBe(uncached(props));
      }
    }
  });

  test("merges onto the shorter answer once settled when merging dropped only repeats", () => {
    const button = untypedTv({ base: "flex flex px-4", variants: { size: { sm: "text-sm" } } });

    for (let index = 0; index < 12; index++) {
      const className = `mt-${String(index)}`;

      expect(button({ className })).toBe(twMerge(`flex flex px-4 ${className}`));
    }
  });

  test("agrees with the engine's whole-text merge for a one-off class", () => {
    const button = untypedTv({ base: "inline-flex px-4 py-2", variants: { size: { sm: "px-2" } } });

    button({ size: "sm" });
    button({ size: "sm" });

    for (let index = 0; index < 50; index++) {
      const className = `w-[${String(index)}px] px-[${String(index)}px]`;

      expect(button({ className, size: "sm" })).toBe(twMerge(`inline-flex px-4 py-2 px-2 ${className}`));
    }
  });
});

describe("a selection meeting many recurring classes", () => {
  test("keeps answering every one exactly once it stops remembering more", () => {
    const button = untypedTv({ base: "inline-flex px-4", variants: { size: { sm: "px-2" } } });

    for (let pass = 0; pass < 3; pass++) {
      for (let index = 0; index < 150; index++) {
        const className = `mt-${String(index % 96)} px-[${String(index)}px]`;

        expect(button({ className, size: "sm" })).toBe(twMerge(`inline-flex px-4 px-2 ${className}`));
      }
    }
  });
});

describe("createClassDoor", () => {
  test("admits a class string from its second sighting", () => {
    const door = createClassDoor();

    expect(door("px-2")).toBe(false);
    expect(door("px-2")).toBe(true);
    expect(door("px-4")).toBe(false);
    expect(door("")).toBe(false);
    expect(door("")).toBe(true);
  });
});
