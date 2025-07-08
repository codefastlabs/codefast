import { describe, expect, it } from "@jest/globals";

import { tsdocRules } from "./tsdoc";

describe("tsdocRules", () => {
  it("should export an array of ESLint configurations", () => {
    expect(Array.isArray(tsdocRules)).toBe(true);
    expect(tsdocRules.length).toBeGreaterThan(0);
  });

  it("should target TypeScript files", () => {
    const config = tsdocRules[0];
    expect(config.files).toEqual(["**/*.{ts,mts,cts,tsx}"]);
  });

  it("should include tsdoc plugin", () => {
    const config = tsdocRules[0];
    expect(config.plugins).toBeDefined();
    expect(config.plugins?.tsdoc).toBeDefined();
  });

  it("should include tsdoc/syntax rule", () => {
    const config = tsdocRules[0];
    expect(config.rules).toBeDefined();
    expect(config.rules?.["tsdoc/syntax"]).toBe("warn");
  });
});
