import path from "node:path";

import { describe, expect, it } from "vitest";

import { exitCodeForTagResult } from "#tag/cli-result";
import { runTag } from "#tag/run";
import { createTagTestFilesystem } from "#tests/unit/support/tag-test-filesystem";

const rootDir = path.join(path.sep, "repo");
const sourceDir = path.join(rootDir, "src");
const blockedFile = path.join(sourceDir, "parse.ts");
const stampedFile = path.join(sourceDir, "format.ts");

const blockedSource = [
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

describe("runTag", () => {
  it("stamps every other file, carries a blocked declaration into the result, and fails the run", async () => {
    const { fs, contentOf } = createTagTestFilesystem({
      [path.join(rootDir, "package.json")]: '{"version":"1.2.0"}',
      [blockedFile]: blockedSource,
      [stampedFile]: [
        "/**",
        " * Formats a value.",
        " */",
        "export function format(): string {",
        '  return "";',
        "}",
        "",
      ].join("\n"),
    });

    const outcome = await runTag(fs, { rootDir, write: true, targetPath: sourceDir });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({
      taggedDeclarations: 1,
      blockedDeclarations: [{ filePath: blockedFile, line: 6, name: "parse" }],
      modifiedFiles: [stampedFile],
    });
    expect(contentOf(stampedFile)).toContain(" * @since 1.2.0");
    expect(contentOf(blockedFile)).toBe(blockedSource);
    expect(exitCodeForTagResult(outcome.value)).toBe(1);
  });
});
