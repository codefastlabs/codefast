import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRAND_COLORS, BRAND_DOWNLOADS, NEUTRAL_COLORS } from "#/features/brand/data";

// Vitest runs from the package root, and `import.meta.url` is not a `file:` URL under jsdom.
const publicDir = path.resolve(process.cwd(), "public");

describe("brand downloads", () => {
  it("point at files that exist under public/", () => {
    const missing = BRAND_DOWNLOADS.filter((asset) => !existsSync(path.join(publicDir, asset.href)));

    expect(missing.map((asset) => asset.href)).toEqual([]);
  });

  it("use unique hrefs", () => {
    const hrefs = BRAND_DOWNLOADS.map((asset) => asset.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("brand palette", () => {
  it("spells every hex as six lowercase digits", () => {
    for (const color of [...BRAND_COLORS, ...NEUTRAL_COLORS]) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
