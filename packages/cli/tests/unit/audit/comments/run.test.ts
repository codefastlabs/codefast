import { describe, expect, it } from "vitest";

import { runCommentAudit } from "#audit/comments/run";
import { auditRoot, createAuditContext } from "#tests/unit/support/audit-context";

const legacyDivider = ["/* -----------", " * Component: Button", " * ----------- */"].join("\n");

describe("runCommentAudit", () => {
  it("reports a legacy divider at its file and line", async () => {
    const { context } = await createAuditContext({ "src/button.tsx": `${legacyDivider}\nexport const a = 1;` });

    const outcome = runCommentAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({
      fixedFiles: [],
      findings: [{ file: "src/button.tsx", line: 1, text: "/* -----------", message: "legacy divider form" }],
    });
  });

  it("rewrites fixable dividers in place with --fix, names the file, then reports clean", async () => {
    const { context, read } = await createAuditContext(
      { "src/button.tsx": `${legacyDivider}\nexport const a = 1;` },
      { fix: true },
    );

    const outcome = runCommentAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({ findings: [], fixedFiles: ["src/button.tsx"] });
    expect(read(`${auditRoot}/src/button.tsx`)).toContain("// ── Component: Button ──");
  });

  it("flags an @since stamped above the package version and accepts one at or below it", async () => {
    const stamped = (version: string): string =>
      ["/**", " * Does a thing.", " *", ` * @since ${version}`, " */"].join("\n");
    const { context } = await createAuditContext({
      "package.json": '{"version":"0.7.0"}',
      "src/high.ts": `${stamped("9.0.0")}\nexport const a = 1;`,
      "src/ok.ts": `${stamped("0.5.0-canary.6")}\nexport const b = 2;`,
    });

    const outcome = runCommentAudit(context);

    expect(outcome.ok && outcome.value.findings).toEqual([
      {
        file: "src/high.ts",
        line: 4,
        text: "@since 9.0.0",
        message: "@since names a version the package has not reached — set it to the release that shipped the symbol",
      },
    ]);
  });

  it("routes content, grammar, and css findings through with their own messages", async () => {
    const { context } = await createAuditContext({
      "src/pointer.ts": `${["/**", " * Field order is fixed; see ARCHITECTURE.md for why.", " */"].join("\n")}\nexport const a = 1;`,
      "src/grammar.ts": `${["/**", " * Benchmarks @codefast/di against upstream.", " */"].join("\n")}\nexport const b = 2;`,
      "src/theme.css": "/* see THEMING.md */\nbody { color: red; }",
    });

    const outcome = runCommentAudit(context);
    const messageOf = (file: string): string | undefined =>
      outcome.ok ? outcome.value.findings.find((finding) => finding.file === file)?.message : undefined;

    expect(messageOf("src/pointer.ts")).toContain("state the invariant");
    expect(messageOf("src/grammar.ts")).toContain("looks like a TSDoc tag");
    expect(messageOf("src/theme.css")).toContain("state the invariant");
  });

  it("enforces the divider in an ignore file while leaving its content rules off", async () => {
    // A legacy hash divider plus a line that would trip the doc-pointer rule if this were code.
    const gitignore = ["# === Dependencies ===", "node_modules", "# see ARCHITECTURE.md for the layout"].join("\n");
    const { context, read } = await createAuditContext({ ".gitignore": gitignore }, { fix: true });

    const outcome = runCommentAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({ findings: [], fixedFiles: [".gitignore"] });
    expect(read(`${auditRoot}/.gitignore`)).toContain("# ── Dependencies ──");
    expect(read(`${auditRoot}/.gitignore`)).toContain("# see ARCHITECTURE.md for the layout");
  });

  it("flags an orphaned {@link} on a full-tree scan, and skips the check on a partial one", async () => {
    const link = (target: string): string => "{@" + `link ${target}}`;
    const files = {
      "src/docs.ts": [
        `/** Streams rows the way ${link("writeRows")} and ${link("goneSymbol")} do. */`,
        "export const c = 3;",
      ].join("\n"),
      "src/writer.ts": "export function writeRows(): void {}",
    };

    const full = runCommentAudit((await createAuditContext(files)).context);
    const partial = runCommentAudit((await createAuditContext(files, { target: "src" })).context);

    expect(full.ok && full.value.findings.map(({ text }) => text)).toEqual(["{@" + "link goneSymbol}"]);
    expect(partial.ok && partial.value.findings).toEqual([]);
  });
});
