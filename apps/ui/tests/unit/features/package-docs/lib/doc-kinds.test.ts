import { describe, expect, it } from "vitest";

import { docPath, docRefFor } from "#/features/package-docs/lib/doc-kinds";

describe("docRefFor", () => {
  it("maps a kind's file at the package root to the kind", () => {
    expect(docRefFor("README.md")).toEqual({ doc: "readme" });
    expect(docRefFor("SPEC.md")).toEqual({ doc: "spec" });
    expect(docRefFor("CHANGELOG.md")).toEqual({ doc: "changelog" });
  });

  it("maps a kind's directory, and its README, to the kind's own page", () => {
    expect(docRefFor("spec")).toEqual({ doc: "spec" });
    expect(docRefFor("spec/README.md")).toEqual({ doc: "spec" });
  });

  it("maps a markdown file inside a kind's directory to a page named after it, lowercased", () => {
    expect(docRefFor("spec/spec-consent.md")).toEqual({ doc: "spec", page: "spec-consent" });
    expect(docRefFor("spec/CHANGELOG.md")).toEqual({ doc: "spec", page: "changelog" });
    expect(docRefFor("spec/vectors/README.md")).toEqual({ doc: "spec", page: "vectors" });
  });

  it("rejects anything that is not a document, including markdown nested deeper than one page", () => {
    expect(docRefFor("NOTES.md")).toBeNull();
    expect(docRefFor("spec/vectors/extra.md")).toBeNull();
    expect(docRefFor("spec/vectors/notes/README.md")).toBeNull();
    expect(docRefFor("examples/20-explicit-architecture/README.md")).toBeNull();
    expect(docRefFor("spec/vectors/vector.schema.json")).toBeNull();
    expect(docRefFor("spec/")).toBeNull();
    expect(docRefFor("src/index.ts")).toBeNull();
  });
});

describe("docPath", () => {
  it("places the README at the package root, a kind under its slug, and a page under the kind", () => {
    expect(docPath("di", "readme")).toBe("/docs/di");
    expect(docPath("di", "spec")).toBe("/docs/di/spec");
    expect(docPath("tracking", "spec", "spec-consent")).toBe("/docs/tracking/spec/spec-consent");
  });
});
