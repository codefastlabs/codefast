import { describe, expect, it } from "vitest";

import { pageTitle } from "#/features/package-docs/lib/doc-page-head";

describe("pageTitle", () => {
  it("names a README after its package and kind", () => {
    expect(pageTitle("@codefast/di", "@codefast/di", "Overview")).toBe("@codefast/di — Overview");
  });

  it("keeps a heading that already carries the package name", () => {
    expect(pageTitle("@codefast/tracking — Spec", "@codefast/tracking", "Specification")).toBe(
      "@codefast/tracking — Spec",
    );
  });

  it("appends the package name to any other heading", () => {
    expect(pageTitle("DI Library — Design Specification", "@codefast/di", "Specification")).toBe(
      "DI Library — Design Specification — @codefast/di",
    );
  });
});
