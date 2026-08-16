import { describe, expect, it } from "vitest";

import { scanTsdocSyntax } from "#/audit/domain/tsdoc-syntax";

const doc = (...lines: Array<string>): string => ["/**", ...lines.map((l) => ` * ${l}`), " */"].join("\n");

describe("scanTsdocSyntax", () => {
  it("accepts a well-formed block with the repo's @since tag", () => {
    const source = doc("Creates a cache for one resolver.", "", "@remarks One entry per plan.", "", "@since 1.0.0");

    expect(scanTsdocSyntax(source)).toStrictEqual([]);
  });

  it("flags a bare at-word the grammar reads as a tag", () => {
    const source = doc("Benchmarks @codefast/di against upstream.");
    const findings = scanTsdocSyntax(source);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.raw).toBe("tsdoc-characters-after-block-tag");
    expect(findings[0]?.line).toBe(2);
  });

  it("accepts the same at-word inside a code span", () => {
    expect(scanTsdocSyntax(doc("Benchmarks `@codefast/di` against upstream."))).toStrictEqual([]);
  });

  it("flags an unescaped brace in prose", () => {
    const findings = scanTsdocSyntax(doc("Returns { tags: [pair] } when matched."));

    expect(findings.map((f) => f.raw)).toContain("tsdoc-escape-right-brace");
  });

  it("ignores a doc block opened inside a string literal", () => {
    const source = 'const fixture = ["/**", " * @codefast/di in prose", " */"].join("\\n");';

    expect(scanTsdocSyntax(source)).toStrictEqual([]);
  });

  it("reports the line of the offending text, not the block start", () => {
    const source = ["const a = 1;", "", doc("A fine summary.", "", "Then a stray } brace.")].join("\n");
    const findings = scanTsdocSyntax(source);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(6);
  });
});
