import path from "node:path";

import { describe, expect, it } from "vitest";

import { prepareRtlAudit } from "#/audit/rtl/prepare";
import { createRootlessFilesystem, createWorkspaceFilesystem } from "#/tests/unit/support/fake-workspace-filesystem";

const rootDir = path.join(path.sep, "fake-repo");

describe("prepareRtlAudit", () => {
  it("fails with VALIDATION_ERROR when no target is passed and none is configured", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareRtlAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("VALIDATION_ERROR");
  });

  it("fails with NOT_FOUND when the passed target does not exist", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareRtlAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: "src/missing" });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });

  it("resolves an existing target to a canonical prelude with an empty allowlist", async () => {
    const target = path.join(rootDir, "src", "ui");
    const fs = createWorkspaceFilesystem({ rootDir, existingPaths: [target] });

    const outcome = await prepareRtlAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: "src/ui" });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toEqual({ rootDir, targetPath: target, allowlist: [] });
  });

  it("fails with INFRA_FAILURE when no project root can be located", async () => {
    const outcome = await prepareRtlAudit(createRootlessFilesystem(), {
      currentWorkingDirectory: rootDir,
      rawTarget: "src/ui",
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
