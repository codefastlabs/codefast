import { describe, expect, it } from "vitest";

import { trimChangelog } from "#/features/package-docs/lib/markdown/trim-changelog";

const changelog = [
  "# @codefast/di",
  "",
  "## 0.3.0",
  "",
  "### Minor",
  "",
  "- c",
  "",
  "## 0.2.0",
  "",
  "- b",
  "",
  "## 0.1.0",
  "",
  "- a",
  "",
].join("\n");

describe("trimChangelog", () => {
  it("keeps the preamble and the newest releases, counting what it cut", () => {
    const trimmed = trimChangelog(changelog, 2);

    expect(trimmed.omitted).toBe(1);
    expect(trimmed.source).toContain("# @codefast/di");
    expect(trimmed.source).toContain("## 0.3.0");
    expect(trimmed.source).toContain("## 0.2.0");
    expect(trimmed.source).not.toContain("## 0.1.0");
    expect(trimmed.source.endsWith("- b")).toBe(true);
  });

  it("returns the source untouched when it has no more releases than the limit", () => {
    expect(trimChangelog(changelog, 3)).toEqual({ source: changelog, omitted: 0 });
    expect(trimChangelog(changelog, 10)).toEqual({ source: changelog, omitted: 0 });
  });
});
