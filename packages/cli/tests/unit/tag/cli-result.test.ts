import { describe, expect, it } from "vitest";

import { exitCodeForTagResult, formatTagJsonOutput } from "#tag/cli-result";
import { createTagResult, explicitTagTarget } from "#tests/unit/support/tag-result";

const blocked = createTagResult({ blockedDeclarations: [{ filePath: "/repo/src/parse.ts", line: 6, name: "parse" }] });

describe("tag cli-result", () => {
  it("exits 1 when a declaration is left unstamped, 0 when the run is clean", () => {
    expect(exitCodeForTagResult(createTagResult())).toBe(0);
    expect(exitCodeForTagResult(blocked)).toBe(1);
  });

  it("serializes ok as exactly the exit code's verdict", () => {
    const failedTarget = createTagResult({
      targetResults: [{ target: explicitTagTarget, targetExists: true, runError: "parse failed", result: null }],
    });

    expect(JSON.parse(formatTagJsonOutput(createTagResult(), "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: true,
      cwd: "/repo",
    });
    expect(JSON.parse(formatTagJsonOutput(blocked, "/repo"))).toMatchObject({
      ok: false,
      result: { blockedDeclarations: [{ line: 6, name: "parse" }] },
    });
    expect(JSON.parse(formatTagJsonOutput(failedTarget, "/repo")).ok).toBe(false);
  });
});
