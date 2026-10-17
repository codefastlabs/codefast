// @vitest-environment node

import { join } from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { AtRule } from "postcss";

const cssDirectory = join(import.meta.dirname, "../../../src/css");

/** Finds the reduced-motion block that targets every element in the preset as an app compiles it. */
async function findGlobalReducedMotionRule(): Promise<AtRule | undefined> {
  const entry = '@import "tailwindcss";\n@import "./preset.css";';
  const { root } = await postcss([tailwindcss()]).process(entry, { from: join(cssDirectory, "app.css") });
  let found: AtRule | undefined;

  root.walkAtRules("media", (media) => {
    const isReducedMotion = media.params.replaceAll(/\s+/g, "") === "(prefers-reduced-motion:reduce)";
    const isGlobal = media.some(
      (node) => node.type === "rule" && node.selectors.toSorted().join() === "*,*::after,*::before",
    );

    if (isReducedMotion && isGlobal) {
      found = media;
    }
  });

  return found;
}

// Per-component `motion-reduce:` guards were dropped once in a refactor; this global rule is what holds the line.
describe("preset reduced-motion rule", () => {
  let rule: AtRule | undefined;

  beforeAll(async () => {
    rule = await findGlobalReducedMotionRule();
  });

  test("is compiled into the preset", () => {
    expect(rule).toBeDefined();
  });

  test("collapses animations and transitions to a near-zero duration", () => {
    const declarations: Record<string, string> = {};

    rule?.walkDecls((declaration) => {
      expect(declaration.important).toBe(true);
      declarations[declaration.prop] = declaration.value;
    });

    // Near-zero rather than `none`, so Radix Presence still sees `animationend` and unmounts closed content.
    expect(declarations).toStrictEqual({
      "animation-duration": "0.001ms",
      "animation-iteration-count": "1",
      "transition-duration": "0.001ms",
    });
  });

  test("sits outside every cascade layer, so a layered `!important` can still opt motion back in", () => {
    expect(rule?.parent?.type).toBe("root");
  });
});
