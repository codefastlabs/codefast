import { describe, expect, it } from "vitest";

import { scanCommentContent } from "#/audit/domain/comment-content";

describe("scanCommentContent", () => {
  it("flags a repo-document pointer in every comment syntax", () => {
    const source = [
      "// see ARCHITECTURE.md for the layering",
      "const a = 1;",
      "/**",
      " * Test taxonomy (see TESTING.md):",
      " */",
      "const b = 2;",
    ].join("\n");

    expect(scanCommentContent(source, "js").map((f) => f.defect)).toStrictEqual(["doc-pointer", "doc-pointer"]);
  });

  it("allows naming a markdown file without pointing at it", () => {
    const source = [
      "// Every figure here already existed on the way to `report.md`.",
      "/** Bare link targets or `repo/relative/doc.md:target` entries to ignore. */",
    ].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("ignores code that mentions a markdown path outside a comment", () => {
    const source = 'const target = "see docs/GUIDE.md";';

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("does not let a comment marker inside a string open a block", () => {
    const source = ['const fixture = ["/**", " * see TESTING.md", " */"].join("\\n");'].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("flags JSDoc type syntax and reports the line", () => {
    const source = ["/**", " * @param {string} name - who to greet", " */"].join("\n");
    const findings = scanCommentContent(source, "js");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 2, defect: "jsdoc-type" });
  });

  it("leaves TSDoc-style tags alone", () => {
    const source = ["/**", " * @param name - who to greet", " * @returns the greeting", " */"].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("flags a @param whose description is not separated by a hyphen", () => {
    const source = ["/**", " * @param libraryName Dependency name keying node_modules.", " */"].join("\n");
    const findings = scanCommentContent(source, "js");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 2, defect: "param-hyphen" });
  });

  it("accepts the hyphenated TSDoc @param form", () => {
    const source = ["/**", " * @param libraryName - Dependency name keying node_modules.", " */"].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("flags a @since followed by another tag", () => {
    const source = ["/**", " * @since 1.0.0", " *", " * @remarks Late remark.", " */"].join("\n");
    const findings = scanCommentContent(source, "js");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 2, defect: "since-order" });
  });

  it("accepts @since as the last tag", () => {
    const source = ["/**", " * @remarks Early remark.", " *", " * @since 1.0.0", " */"].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("flags a // run wedged between a doc block and its declaration", () => {
    const source = [
      "/**",
      " * @since 1.0.0",
      " */",
      "// An implementation note that detaches the block above.",
      "export const GRID = 5;",
    ].join("\n");
    const findings = scanCommentContent(source, "js");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ line: 4, defect: "detached-doc" });
  });

  it("accepts a // comment that has no doc block above it", () => {
    const source = ["// A plain implementation note.", "export const GRID = 5;"].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("flags a block naming one parameter while the signature has more", () => {
    const source = [
      "/**",
      " * @param title - the section name",
      " */",
      "export function render(indent: string, title: string, language: Language): string {",
    ].join("\n");
    const findings = scanCommentContent(source, "js");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ defect: "param-coverage", raw: "@param missing: indent, language" });
  });

  it("accepts a complete @param list and skips destructured parameters", () => {
    const source = [
      "/**",
      " * @param locale - BCP 47 tag the formatter renders in",
      " */",
      "function formatValue({ value, precision }: Options, locale: string): string {",
    ].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("never guesses through a wrapper call around the signature", () => {
    const source = [
      "/**",
      " * @param event - the blur event",
      " */",
      "const handleBlur = useCallback<FocusEventHandler>((event, extra) => {},",
      "  [deps],",
      ");",
    ].join("\n");

    expect(scanCommentContent(source, "js")).toStrictEqual([]);
  });

  it("scans css block comments", () => {
    const source = ["/* see THEMING.md before adding a token */", "body { color: red; }"].join("\n");

    expect(scanCommentContent(source, "css").map((f) => f.defect)).toStrictEqual(["doc-pointer"]);
  });
});
