import { describe, expect, it } from "vitest";

import { scanCommentContent } from "#audit/comments/domain/comment-content";
import type { TagFileResult } from "#tag/domain/types";
import { TagSinceWriter } from "#tag/writer/since-writer";
import { createTagTestFilesystem } from "#tests/unit/support/tag-test-filesystem";

const filePath = "/virtual/src/module.ts";
const version = "0.0.0-test";

function tagSource(source: string, write: boolean): { readonly result: TagFileResult; readonly written: string } {
  const { fs, contentOf } = createTagTestFilesystem({ [filePath]: source });
  const result = new TagSinceWriter(fs).applySinceTagsToFile(filePath, version, write);
  return { result, written: contentOf(filePath) ?? "" };
}

describe("TagSinceWriter", () => {
  it("does not emit a trailing space after * on blank JSDoc continuation lines", () => {
    const { written } = tagSource(
      ["/**", " * First paragraph.", " *", " * Second paragraph.", " */", "export function taggedFn() {}", ""].join(
        "\n",
      ),
      true,
    );

    const emptyContinuationWithTrailingSpace = /^\s+\* \s*$/m;
    expect(written).not.toMatch(emptyContinuationWithTrailingSpace);
    expect(written).toContain("* @since 0.0.0-test");
  });

  it("stamps every overload signature and the implementation, each in its own block", () => {
    const { result, written } = tagSource(
      [
        "/**",
        " * Formats a string.",
        " */",
        "export function format(value: string): string;",
        "/**",
        " * Formats a number.",
        " */",
        "export function format(value: number): string;",
        "/**",
        " * Formats either kind.",
        " */",
        "export function format(value: string | number): string {",
        "  return String(value);",
        "}",
        "",
      ].join("\n"),
      true,
    );

    expect(result).toMatchObject({ taggedDeclarations: 3, blockedDeclarations: [], changed: true });
    expect(written).toBe(
      [
        "/**",
        " * Formats a string.",
        " *",
        " * @since 0.0.0-test",
        " */",
        "export function format(value: string): string;",
        "/**",
        " * Formats a number.",
        " *",
        " * @since 0.0.0-test",
        " */",
        "export function format(value: number): string;",
        "/**",
        " * Formats either kind.",
        " *",
        " * @since 0.0.0-test",
        " */",
        "export function format(value: string | number): string {",
        "  return String(value);",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("writes a block for an overload signature that has none, directly above it", () => {
    const { result, written } = tagSource(
      [
        "/**",
        " * Formats a value.",
        " *",
        " * @since 0.0.0-old",
        " */",
        "export function format(value: string): string;",
        "export function format(value: number): string;",
        "/**",
        " * Formats either kind.",
        " *",
        " * @since 0.0.0-old",
        " */",
        "export function format(value: string | number): string {",
        "  return String(value);",
        "}",
        "",
      ].join("\n"),
      true,
    );

    expect(result.taggedDeclarations).toBe(1);
    expect(written).toContain(
      ["export function format(value: string): string;", "/**", " * @since 0.0.0-test", " */"].join("\n"),
    );
    expect(written.match(/@since/g)).toHaveLength(3);
  });

  it("stamps a declare function and local overloads exported by name", () => {
    const { result, written } = tagSource(
      [
        "export declare function ambient(): void;",
        "",
        "function local(value: string): string;",
        "function local(value: unknown): string {",
        "  return String(value);",
        "}",
        "",
        "export { local };",
        "",
      ].join("\n"),
      true,
    );

    expect(result.taggedDeclarations).toBe(3);
    expect(written).toBe(
      [
        "/**",
        " * @since 0.0.0-test",
        " */",
        "export declare function ambient(): void;",
        "",
        "/**",
        " * @since 0.0.0-test",
        " */",
        "function local(value: string): string;",
        "/**",
        " * @since 0.0.0-test",
        " */",
        "function local(value: unknown): string {",
        "  return String(value);",
        "}",
        "",
        "export { local };",
        "",
      ].join("\n"),
    );
  });

  it("reports a declaration under a // note and leaves its file as it is, rather than stacking a block on the note", () => {
    const source = [
      "/**",
      " * Parses a string.",
      " */",
      "export function parse(value: string): number;",
      "// The overload above is what a caller is checked against.",
      "export function parse(value: unknown): number {",
      "  return Number(value);",
      "}",
      "",
    ].join("\n");

    const { result, written } = tagSource(source, true);

    expect(result).toStrictEqual({
      filePath,
      taggedDeclarations: 0,
      blockedDeclarations: [{ filePath, line: 6, name: "parse" }],
      changed: false,
    });
    expect(written).toBe(source);
  });

  it("reports a declaration under a tooling directive instead of parting the directive from it", () => {
    const source = ["// oxlint-disable-next-line typescript/no-explicit-any", "export const loose: any = 1;", ""].join(
      "\n",
    );

    const { result, written } = tagSource(source, true);

    expect(result).toStrictEqual({
      filePath,
      taggedDeclarations: 0,
      blockedDeclarations: [{ filePath, line: 2, name: "loose" }],
      changed: false,
    });
    expect(written).toBe(source);
  });

  it("names an anonymous default export default in its report", () => {
    const { result } = tagSource(["// Wired by the host.", "export default function () {}", ""].join("\n"), false);

    expect(result.blockedDeclarations).toStrictEqual([{ filePath, line: 2, name: "default" }]);
  });

  it("writes a block under a section divider, which the comment audit accepts above a doc block", () => {
    const { result, written } = tagSource(
      ["// ── Helpers ──", "export function helper(): void {}", ""].join("\n"),
      true,
    );

    expect(result).toMatchObject({ taggedDeclarations: 1, blockedDeclarations: [] });
    expect(written).toBe(
      ["// ── Helpers ──", "/**", " * @since 0.0.0-test", " */", "export function helper(): void {}", ""].join("\n"),
    );
    expect(scanCommentContent(written, "js")).toStrictEqual([]);
  });

  it("reports the same blocked declaration on a dry run", () => {
    const source = [
      "// Wired by the host.",
      "export function mount(): void {}",
      "export function unmount(): void {}",
      "",
    ].join("\n");

    const dryRun = tagSource(source, false);
    const applied = tagSource(source, true);

    expect(dryRun.result).toStrictEqual(applied.result);
    expect(dryRun.result).toMatchObject({ taggedDeclarations: 0, blockedDeclarations: [{ line: 2, name: "mount" }] });
    expect(applied.written).toBe(source);
  });
});
