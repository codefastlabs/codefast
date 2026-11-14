import { afterEach, describe, expect, it, vi } from "vitest";

import { refuseColor } from "#core/style";
import type { SinceStampReport } from "#since/domain/types";
import { presentSinceStampReport, sinceStampVerdict } from "#since/output";
import { createCommandContext } from "#tests/unit/support/command-context";
import { captureLogger } from "#tests/unit/support/logger-capture";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

afterEach(() => {
  refuseColor(false);
  vi.restoreAllMocks();
});

const report: SinceStampReport = {
  packages: [
    {
      name: "@acme/kit",
      directory: "packages/kit",
      status: "changed",
      reason: null,
      files: ["packages/kit/src/format.ts"],
      version: "1.2.0",
      filesScanned: 2,
      stampedDeclarations: 1,
    },
  ],
  findings: [{ file: "packages/kit/src/parse.ts", line: 6, text: "parse", message: "write the block by hand" }],
};

describe("presentSinceStampReport", () => {
  it("prints each package, then each declaration left unstamped, then the summary", async () => {
    refuseColor(true);
    const { fs } = createMemoryFilesystem({ "/repo/package.json": "{}" });
    const context = await createCommandContext<"dryRun">(fs, { cwd: "/repo", flags: { dryRun: false } });
    const printed = captureLogger();

    presentSinceStampReport(report, { ...context, elapsedSeconds: 0.25 });

    expect(printed.out()).toBe(
      [
        "✎ @acme/kit  @since 1.2.0 on 1 declarations in 1 of 2 files",
        "\npackages/kit/src/parse.ts",
        "  6: parse → write the block by hand",
        "\n✗ since:stamp: 1 changed; 1 declarations stamped, 1 left unstamped (0.25s)",
      ].join("\n"),
    );
  });
});

describe("sinceStampVerdict", () => {
  it("fails on a declaration left unstamped, since a later stamp would name the wrong version", () => {
    expect(sinceStampVerdict(report)).toBe("fail");
    expect(sinceStampVerdict({ ...report, findings: [] })).toBe("pass");
  });
});
