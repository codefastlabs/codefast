import { describe, expect, it } from "vitest";

import { selectPackageConfig } from "#core/config/package-selector";

describe("selectPackageConfig", () => {
  const record = { "@apps/*": false, "@acme/ui": { strip: "./components/" }, "@acme/*": false } as const;

  it("prefers the exact name over a glob that also matches", () => {
    expect(selectPackageConfig(record, "@acme/ui")).toEqual({ strip: "./components/" });
  });

  it("falls back to the first glob key that matches", () => {
    expect(selectPackageConfig(record, "@apps/web")).toBe(false);
    expect(selectPackageConfig(record, "@acme/di")).toBe(false);
  });

  it("returns undefined for a package nothing names, and for no record at all", () => {
    expect(selectPackageConfig(record, "@other/x")).toBeUndefined();
    expect(selectPackageConfig(undefined, "@acme/ui")).toBeUndefined();
  });
});
