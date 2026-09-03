import { describe, expect, it } from "vitest";

import { DOC_PACKAGES, PACKAGES, docSource } from "#/features/package-docs/lib/doc-source.impl";

describe("package discovery", () => {
  it("lists every published package with its documents, sorted by name", () => {
    const names = PACKAGES.map((pkg) => pkg.name);

    expect(names).toEqual([...names].toSorted((a, b) => a.localeCompare(b)));
    expect(names).toContain("@codefast/di");
    expect(names).toContain("@codefast/ui");
    expect(names).not.toContain("@codefast/benchmark-harness");

    const di = PACKAGES.find((pkg) => pkg.slug === "di");

    expect(di?.docs.map((entry) => entry.doc)).toEqual([
      "readme",
      "spec",
      "architecture",
      "learning",
      "contributing",
      "changelog",
    ]);
    expect(di?.docs.every((entry) => entry.pages.length === 0)).toBe(true);
    expect(di?.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(di?.license).toBe("MIT");
  });

  it("serves a directory kind's README as the kind and its other files as sorted pages beneath it", () => {
    const spec = PACKAGES.find((pkg) => pkg.slug === "tracking")?.docs.find((entry) => entry.doc === "spec");

    expect(spec?.pages).toEqual([...(spec?.pages ?? [])].toSorted());
    expect(spec?.pages).toEqual(expect.arrayContaining(["changelog", "spec-consent", "spec-security", "vectors"]));
    expect(spec?.pages).not.toContain("readme");
  });

  it("excludes @codefast/ui from the docs section", () => {
    expect(DOC_PACKAGES.some((pkg) => pkg.slug === "ui")).toBe(false);
    expect(DOC_PACKAGES.length).toBe(PACKAGES.length - 1);
  });

  it("resolves a document to its source file and returns null for anything else", async () => {
    expect(docSource("di", "spec")?.file).toBe("SPEC.md");
    await expect(docSource("di", "spec")?.load()).resolves.toMatch(/^# /);
    expect(docSource("tracking", "spec")?.file).toBe("spec/README.md");
    expect(docSource("tracking", "spec", "spec-consent")?.file).toBe("spec/spec-consent.md");
    expect(docSource("tracking", "spec", "vectors")?.file).toBe("spec/vectors/README.md");
    expect(docSource("tracking", "spec", "nope")).toBeNull();
    expect(docSource("di", "spec", "spec-consent")).toBeNull();
    expect(docSource("di", "decisions")).toBeNull();
    expect(docSource("ui", "readme")).toBeNull();
    expect(docSource("nope", "readme")).toBeNull();
  });
});
