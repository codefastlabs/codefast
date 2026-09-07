import { describe, expect, it } from "vitest";

import { rewriteDocImage, rewriteDocLink } from "#/features/package-docs/lib/markdown/rewrite-link";

const inDiReadme = { pkg: "di", file: "README.md" };
const inDiSpec = { pkg: "di", file: "SPEC.md" };
const inTrackingSpecPage = { pkg: "tracking", file: "spec/spec-consent.md" };
const inTrackingVectors = { pkg: "tracking", file: "spec/vectors/README.md" };

describe("rewriteDocLink", () => {
  it("passes external URLs and in-page anchors through", () => {
    expect(rewriteDocLink("https://example.com/x", inDiReadme)).toBe("https://example.com/x");
    expect(rewriteDocLink("mailto:hi@example.com", inDiReadme)).toBe("mailto:hi@example.com");
    expect(rewriteDocLink("#goals", inDiReadme)).toBe("#goals");
  });

  it("maps a sibling document to its docs page, keeping the anchor", () => {
    expect(rewriteDocLink("./SPEC.md", inDiReadme)).toBe("/docs/di/spec");
    expect(rewriteDocLink("SPEC.md#21-naming", inDiReadme)).toBe("/docs/di/spec#21-naming");
    expect(rewriteDocLink("ARCHITECTURE.md", inDiSpec)).toBe("/docs/di/architecture");
    expect(rewriteDocLink("./README.md", inDiSpec)).toBe("/docs/di");
  });

  it("maps another package's docs and directory to its pages", () => {
    expect(rewriteDocLink("../di-testing/README.md", inDiReadme)).toBe("/docs/di-testing");
    expect(rewriteDocLink("../theme", inDiReadme)).toBe("/docs/theme");
    expect(rewriteDocLink("../../packages/tracking/spec/README.md", inDiReadme)).toBe("/docs/tracking/spec");
  });

  it("maps the files of a directory kind to the pages beneath it, resolving from the document's own directory", () => {
    expect(rewriteDocLink("spec-identity.md#3-minting", inTrackingSpecPage)).toBe(
      "/docs/tracking/spec/spec-identity#3-minting",
    );
    expect(rewriteDocLink("README.md", inTrackingSpecPage)).toBe("/docs/tracking/spec");
    expect(rewriteDocLink("CHANGELOG.md", inTrackingSpecPage)).toBe("/docs/tracking/spec/changelog");
    expect(rewriteDocLink("vectors/README.md", inTrackingSpecPage)).toBe("/docs/tracking/spec/vectors");
    expect(rewriteDocLink("../README.md", inTrackingSpecPage)).toBe("/docs/tracking");
    expect(rewriteDocLink("../CHANGELOG.md", inTrackingSpecPage)).toBe("/docs/tracking/changelog");
    expect(rewriteDocLink("../spec-consent.md", inTrackingVectors)).toBe("/docs/tracking/spec/spec-consent");
    expect(rewriteDocLink("./spec", inDiReadme)).toBe("/docs/di/spec");
  });

  it("sends a directory kind's non-markdown files, and markdown outside any kind, to GitHub", () => {
    expect(rewriteDocLink("vectors/vector.schema.json", inTrackingSpecPage)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/tracking/spec/vectors/vector.schema.json",
    );
    expect(rewriteDocLink("../LICENSE", inTrackingSpecPage)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/tracking/LICENSE",
    );
    expect(rewriteDocLink("./examples/20-explicit-architecture/README.md", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/di/examples/20-explicit-architecture/README.md",
    );
  });

  it("sends @codefast/ui docs to the component gallery", () => {
    expect(rewriteDocLink("../ui/README.md", inDiReadme)).toBe("/ui");
    expect(rewriteDocLink("../ui", inDiReadme)).toBe("/ui");
  });

  it("sends every other repo file to GitHub, blob for files and tree for directories", () => {
    expect(rewriteDocLink("./src/index.ts", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/di/src/index.ts",
    );
    expect(rewriteDocLink("examples/20-explicit-architecture", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/tree/main/packages/di/examples/20-explicit-architecture",
    );
    expect(rewriteDocLink("../../CLAUDE.md#comments", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/CLAUDE.md#comments",
    );
    expect(rewriteDocLink("/TESTING.md", inDiSpec)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/TESTING.md",
    );
  });

  it("links extensionless repo files such as LICENSE as blobs, not directories", () => {
    expect(rewriteDocLink("./LICENSE", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/di/LICENSE",
    );
  });

  it("does not treat an unknown markdown file as a docs page", () => {
    expect(rewriteDocLink("./NOTES.md", inDiReadme)).toBe(
      "https://github.com/codefastlabs/codefast/blob/main/packages/di/NOTES.md",
    );
  });
});

describe("rewriteDocImage", () => {
  it("serves a relative image from the raw GitHub host", () => {
    expect(rewriteDocImage("./assets/graph.png", inDiReadme)).toBe(
      "https://raw.githubusercontent.com/codefastlabs/codefast/main/packages/di/assets/graph.png",
    );
    expect(rewriteDocImage("https://img.shields.io/x.svg", inDiReadme)).toBe("https://img.shields.io/x.svg");
  });
});
