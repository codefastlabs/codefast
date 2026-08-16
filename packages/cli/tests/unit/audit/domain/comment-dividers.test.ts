import { describe, expect, it } from "vitest";

import type { DividerLanguage } from "#/audit/domain/comment-dividers";
import {
  applyCommentDividerFixes,
  DIVIDER_COLUMN,
  renderDivider,
  scanCommentDividers,
} from "#/audit/domain/comment-dividers";

function fix(lines: Array<string>, language: DividerLanguage = "js"): Array<string> {
  return applyCommentDividerFixes(lines.join("\n"), language).content.split("\n");
}

describe("renderDivider", () => {
  it("ends at the fixed column in both comment syntaxes", () => {
    expect(renderDivider("", "Component: Button", "js")).toHaveLength(DIVIDER_COLUMN);
    expect(renderDivider("", "Surfaces", "css")).toHaveLength(DIVIDER_COLUMN);
  });

  it("counts indentation toward the column", () => {
    expect(renderDivider("  ", "Charts", "css")).toHaveLength(DIVIDER_COLUMN);
  });

  it("keeps a minimum rule when the title would overflow the column", () => {
    const rendered = renderDivider("", "T".repeat(DIVIDER_COLUMN), "js");

    expect(rendered.endsWith("──")).toBe(true);
  });
});

describe("scanCommentDividers", () => {
  it("accepts a divider already in the canonical form", () => {
    const regions = scanCommentDividers(renderDivider("", "Exports", "js"), "js");

    expect(regions).toHaveLength(1);
    expect(regions[0]?.defect).toBeNull();
  });

  it("separates a mispadded canonical divider from a legacy one", () => {
    const regions = scanCommentDividers(["// ── Exports ──", "", "// --- Exports ---"].join("\n"), "js");

    expect(regions.map((region) => region.defect)).toStrictEqual(["bad-width", "legacy-form"]);
  });

  it("reads the title out of every banner shape the repo grew", () => {
    const banners = [
      ["/* -----------", " * Component: Button", " * ----------- */"],
      ["// -----------", "// Context: Carousel", "// -----------"],
      ["// ===========", "// 1. TokenNotBoundError", "// ==========="],
      ["// ───────────", "// Registry", "// ───────────"],
      ["// --- Position ---"],
    ];

    for (const banner of banners) {
      const regions = scanCommentDividers(banner.join("\n"), "js");

      expect(regions).toHaveLength(1);
      expect(regions[0]?.title).not.toBeNull();
      expect(regions[0]?.defect).toBe("legacy-form");
    }
  });

  it("reads a framed block carrying prose as a doc block, not a divider", () => {
    const source = [
      "// ───────────",
      "// 1. whenParentIs",
      "//",
      "//    Two siblings share a Logger.",
      "// ───────────",
    ].join("\n");

    expect(scanCommentDividers(source, "js")).toStrictEqual([]);
  });

  it("reads a CSS file header closed by a bare rule as a doc block", () => {
    const source = [
      "/* ----------",
      " * Sky theme",
      " *",
      " * Every token the sky palette overrides.",
      "   ---------- */",
    ].join("\n");

    expect(scanCommentDividers(source, "css")).toStrictEqual([]);
  });

  it("reads a lone framed sentence as a doc block", () => {
    const source = ["/* ----------", " * Home-page motion, gated behind prefers-reduced-motion.", " * ---------- */"];

    expect(scanCommentDividers(source.join("\n"), "css")).toStrictEqual([]);
  });

  it("ignores a rule that is a table separator inside a doc block", () => {
    const source = [
      "/**",
      " * Constraint          | What it matches",
      " * ──────────────────────────────────────",
      " * whenParentIs(T)     | direct parent",
      " */",
    ].join("\n");

    expect(scanCommentDividers(source, "js")).toStrictEqual([]);
  });
});

describe("applyCommentDividerFixes", () => {
  it("collapses a three-line banner to one canonical line", () => {
    expect(fix(["/* -----------", " * Component: Button", " * ----------- */"])).toStrictEqual([
      renderDivider("", "Component: Button", "js"),
    ]);
  });

  it("renders in the file's syntax, not the banner's", () => {
    expect(fix(["  /* ----------", "   * Charts", "   * ---------- */"], "css")).toStrictEqual([
      renderDivider("  ", "Charts", "css"),
    ]);
  });

  it("leaves surrounding code untouched and repads in place", () => {
    expect(fix(["const before = 1;", "", "// --- Helpers -----", "", "const after = 2;"])).toStrictEqual([
      "const before = 1;",
      "",
      renderDivider("", "Helpers", "js"),
      "",
      "const after = 2;",
    ]);
  });

  it("rewrites every divider in a file without shifting the later ones", () => {
    const { content, fixedCount } = applyCommentDividerFixes(
      ["// --- One ---", "const a = 1;", "/* ----", " * Two", " * ---- */", "const b = 2;"].join("\n"),
      "js",
    );

    expect(fixedCount).toBe(2);
    expect(content.split("\n")).toStrictEqual([
      renderDivider("", "One", "js"),
      "const a = 1;",
      renderDivider("", "Two", "js"),
      "const b = 2;",
    ]);
  });

  it("leaves a doc block exactly as written", () => {
    const source = ["// ─────", "// Title", "//", "// Prose that would be lost.", "// ─────"].join("\n");

    expect(applyCommentDividerFixes(source, "js")).toStrictEqual({ content: source, fixedCount: 0 });
  });

  it("preserves CRLF line endings", () => {
    const { content } = applyCommentDividerFixes(["// --- One ---", "const a = 1;"].join("\r\n"), "js");

    expect(content).toBe([renderDivider("", "One", "js"), "const a = 1;"].join("\r\n"));
  });
});
