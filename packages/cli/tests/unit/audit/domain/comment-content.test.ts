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

  it("scans css block comments", () => {
    const source = ["/* see THEMING.md before adding a token */", "body { color: red; }"].join("\n");

    expect(scanCommentContent(source, "css").map((f) => f.defect)).toStrictEqual(["doc-pointer"]);
  });
});
