import path from "node:path";

import { describe, expect, it } from "vitest";

import { prepareEnginesAudit } from "#audit/engines/prepare";
import { createWorkspaceFilesystem } from "#tests/unit/support/fake-workspace-filesystem";

const rootDir = path.join(path.sep, "fake-repo-engines");

describe("prepareEnginesAudit", () => {
  it("defaults the scan target to the repo root and takes no allowlist", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareEnginesAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });

    expect(outcome).toEqual({ ok: true, value: { rootDir, targetPath: rootDir, allowlist: [] } });
  });

  it("fails with NOT_FOUND when the passed target does not exist", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareEnginesAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: "packages/missing" });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });
});
