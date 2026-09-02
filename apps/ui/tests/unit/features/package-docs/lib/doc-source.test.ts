import { describe, expect, it } from "vitest";

import { DOC_PACKAGES, PACKAGES, loadRawDoc } from "#/features/package-docs/lib/doc-source.impl";

describe("package discovery", () => {
  it("lists every published package with its documents, sorted by name", () => {
    const names = PACKAGES.map((pkg) => pkg.name);

    expect(names).toEqual([...names].toSorted((a, b) => a.localeCompare(b)));
    expect(names).toContain("@codefast/di");
    expect(names).toContain("@codefast/ui");
    expect(names).not.toContain("@codefast/benchmark-harness");

    const di = PACKAGES.find((pkg) => pkg.slug === "di");

    expect(di?.docs).toEqual(["readme", "spec", "architecture", "learning", "contributing", "changelog"]);
    expect(di?.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(di?.license).toBe("MIT");
  });

  it("excludes @codefast/ui from the docs section", () => {
    expect(DOC_PACKAGES.some((pkg) => pkg.slug === "ui")).toBe(false);
    expect(DOC_PACKAGES.length).toBe(PACKAGES.length - 1);
  });

  it("loads a document's raw markdown and returns null for anything else", async () => {
    await expect(loadRawDoc("di", "spec")).resolves.toMatch(/^# /);
    await expect(loadRawDoc("di", "decisions")).resolves.toBeNull();
    await expect(loadRawDoc("ui", "readme")).resolves.toBeNull();
    await expect(loadRawDoc("nope", "readme")).resolves.toBeNull();
  });
});
