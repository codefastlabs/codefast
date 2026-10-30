import { twMerge } from "tailwind-merge";

import { createMergingCn } from "#class-names";
import { cn, createTV, cx } from "#index";
import type { ClassValue } from "#index";

/** clsx 2.1.1's own algorithm, the contract `cx` reproduces. */
const referenceValue = (value: unknown): string => {
  let text = "";

  if (typeof value === "string" || typeof value === "number") {
    text += String(value);
  } else if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const part = item ? referenceValue(item) : "";

        if (part) {
          text = text ? `${text} ${part}` : part;
        }
      }
    } else {
      for (const key in value) {
        if ((value as Record<string, unknown>)[key]) {
          text = text ? `${text} ${key}` : key;
        }
      }
    }
  }

  return text;
};

const referenceCx = (...classes: Array<unknown>): string => referenceValue(classes);

/** A deterministic pseudo-random sequence, so a failing draw reproduces. */
const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state / 2_147_483_648;
  };
};

const STRINGS = ["px-2", "px-4", "py-1", "text-sm", "text-lg", "font-bold", "", "  ", "p-2 px-6"];

const drawValue = (random: () => number, depth: number): unknown => {
  const pick = Math.floor(random() * 12);

  switch (pick) {
    case 0:
      return undefined;
    case 1:
      return null;
    case 2:
      return random() < 0.5;
    case 3:
      return Math.floor(random() * 3);
    case 4:
      return depth > 2 ? "m-1" : [drawValue(random, depth + 1), drawValue(random, depth + 1)];
    case 5:
      return { "text-red-500": random() < 0.5, "text-blue-500": random() < 0.5, "": true };
    case 6:
      return 0n;
    default:
      return STRINGS[Math.floor(random() * STRINGS.length)];
  }
};

const drawCall = (random: () => number): Array<ClassValue> =>
  Array.from({ length: Math.floor(random() * 5) }, () => drawValue(random, 0) as ClassValue);

describe("cx", () => {
  test("joins every drawn call exactly as clsx does", () => {
    const random = createRandom(3);

    for (let call = 0; call < 3000; call++) {
      const classes = drawCall(random);

      expect(cx(...classes)).toBe(referenceCx(...classes));
    }
  });
});

describe("cn", () => {
  test("merges every drawn call exactly as tailwind-merge does over the clsx join, repeats included", () => {
    const random = createRandom(5);
    const calls = Array.from({ length: 400 }, () => drawCall(random));

    for (let pass = 0; pass < 3; pass++) {
      for (const classes of calls) {
        expect(cn(...classes)).toBe(twMerge(referenceCx(...classes)));
      }
    }
  });

  test("answers a repeated pair of strings without merging it again", () => {
    const merged: Array<string> = [];
    const pairCn = createMergingCn((classes) => {
      merged.push(classes);

      return classes;
    });

    pairCn("px-2", "px-4");
    pairCn("px-2", "px-4");
    pairCn("px-2", "px-4");
    pairCn("px-2", undefined, "px-4", false);

    expect(merged).toEqual(["px-2 px-4", "px-2 px-4"]);
  });

  test("keeps answering correctly once a base class has more overrides than it remembers", () => {
    const pairCn = createMergingCn(twMerge);

    for (let pass = 0; pass < 3; pass++) {
      for (let index = 0; index < 40; index++) {
        expect(pairCn("p-2 text-sm", `p-${String(index)}`)).toBe(twMerge(`p-2 text-sm p-${String(index)}`));
      }
    }
  });

  test("keeps answering correctly across many retired generations", () => {
    const pairCn = createMergingCn(twMerge);

    for (let pass = 0; pass < 3; pass++) {
      for (let index = 0; index < 3000; index++) {
        const first = `w-${String(index % 1500)}`;

        expect(pairCn(first, "w-full")).toBe("w-full");
        expect(pairCn(first, `h-${String(index)}`)).toBe(`${first} h-${String(index)}`);
      }
    }
  });

  test("routes a createTV factory's cn through its own merge, or through none", () => {
    const merged: Array<string> = [];
    const { cn: customCn } = createTV({
      twMerge: (classes) => {
        merged.push(classes);

        return classes.toUpperCase();
      },
    });
    const { cn: plainCn } = createTV({ twMerge: false });

    expect(customCn("px-2", "px-4")).toBe("PX-2 PX-4");
    expect(customCn(["px-2"], { "px-4": true })).toBe("PX-2 PX-4");
    expect(merged).toEqual(["px-2 px-4", "px-2 px-4"]);
    expect(plainCn("px-2", "px-4")).toBe("px-2 px-4");
    expect(createTV({}).cn).toBe(cn);
  });
});

describe("cn: the default engine", () => {
  test("should work like cx but with merging", () => {
    const result = cn("text-xl", "text-blue-500", "text-2xl", "text-red-500");

    expect(result).toBe("text-2xl text-red-500");
  });

  test("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive ? "active-class" : "", "text-xl", "text-blue-500");

    expect(result).toBe("base-class active-class text-xl text-blue-500");
  });

  test("should handle arrays and objects", () => {
    const result = cn(["text-xl", "font-bold"], { "text-blue-500": false, "text-red-500": true });

    expect(result).toBe("text-xl font-bold text-red-500");
  });

  test("should handle empty values", () => {
    const result = cn("", null, undefined, false, 0, "text-xl");

    expect(result).toBe("text-xl");
  });

  test("should work with conflicting classes", () => {
    const result = cn("p-4", "p-8", "m-2", "m-4");

    expect(result).toBe("p-8 m-4");
  });

  test("should work with non-conflicting classes", () => {
    const result = cn("text-xl", "font-bold", "text-blue-500", "bg-white");

    expect(result).toBe("text-xl font-bold text-blue-500 bg-white");
  });
});

describe("cx: edge cases", () => {
  test("should handle empty array", () => {
    expect(cx()).toBe("");
  });

  test("should handle single string argument", () => {
    expect(cx("flex")).toBe("flex");
  });

  test("should handle single falsy argument", () => {
    expect(cx(false)).toBe("");
    expect(cx(null)).toBe("");
    expect(cx()).toBe("");
    expect(cx(0)).toBe("");
    expect(cx("")).toBe("");
  });

  test("should handle single non-string truthy argument", () => {
    expect(cx(["flex", "items-center"])).toBe("flex items-center");
    expect(cx({ "bg-blue-500": true, "bg-red-500": false })).toBe("bg-blue-500");
  });

  test("should handle multiple arguments with clsx", () => {
    expect(cx("flex", { "bg-blue-500": true }, ["items-center", "justify-center"])).toBe(
      "flex bg-blue-500 items-center justify-center",
    );
  });
});

describe("cn: edge cases", () => {
  test("should handle empty array", () => {
    expect(cn()).toBe("");
  });

  test("should handle single string argument with twMerge", () => {
    expect(cn("bg-blue-500 bg-red-500")).toBe("bg-red-500");
  });

  test("should handle single falsy argument", () => {
    expect(cn(false)).toBe("");
    expect(cn(null)).toBe("");
    expect(cn()).toBe("");
    expect(cn(0)).toBe("");
    expect(cn("")).toBe("");
  });

  test("should handle single non-string truthy argument with twMerge", () => {
    expect(cn(["bg-red-500", "bg-blue-500"])).toBe("bg-blue-500");
    expect(cn({ "bg-red-500": true, "bg-blue-500": true })).toBe("bg-blue-500");
  });

  test("should handle multiple arguments with clsx and twMerge", () => {
    expect(cn("bg-red-500", { "bg-blue-500": true }, ["text-sm", "text-lg"])).toBe("bg-blue-500 text-lg");
  });
});
