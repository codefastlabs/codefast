import { describe, expect, it, vi } from "vitest";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { presentArrangeSyncResult } from "#/lib/arrange/presentation/arrange-sync.presenter";

function createCapturingLogger(): { logger: CliLogger; outs: string[]; errs: string[] } {
  const outs: string[] = [];
  const errs: string[] = [];
  return {
    logger: {
      out: vi.fn((line: string) => {
        outs.push(line);
      }),
      err: vi.fn((line: string) => {
        errs.push(line);
      }),
    },
    outs,
    errs,
  };
}

describe("presentArrangeSyncResult", () => {
  it("returns success when hook completes without error", () => {
    const { logger } = createCapturingLogger();
    const code = presentArrangeSyncResult(
      logger,
      {
        filePaths: [],
        modifiedFiles: [],
        totalFound: 0,
        totalChanged: 0,
        hookError: null,
      },
      false,
    );
    expect(code).toBe(CLI_EXIT_SUCCESS);
  });

  it("returns general error when onAfterWrite hook fails", () => {
    const { logger, errs } = createCapturingLogger();
    const code = presentArrangeSyncResult(
      logger,
      {
        filePaths: ["/a.tsx"],
        modifiedFiles: ["/a.tsx"],
        totalFound: 1,
        totalChanged: 1,
        hookError: "hook failed",
      },
      true,
    );
    expect(code).toBe(CLI_EXIT_GENERAL_ERROR);
    expect(errs).toContain("hook failed");
  });
});
