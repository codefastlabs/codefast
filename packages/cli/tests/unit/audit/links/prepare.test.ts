import path from "node:path";

import { describe, expect, it } from "vitest";

import { prepareLinkAudit } from "#/audit/links/prepare";
import { createWorkspaceFilesystem } from "#/tests/unit/support/fake-workspace-filesystem";

const rootDir = path.join(path.sep, "fake-repo-links");

describe("prepareLinkAudit (repo-root prelude)", () => {
  it("defaults the scan target to the repo root when none is passed", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareLinkAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toEqual({ rootDir, targetPath: rootDir, allowlist: [] });
  });

  it("fails with NOT_FOUND when the passed target does not exist", async () => {
    const fs = createWorkspaceFilesystem({ rootDir });

    const outcome = await prepareLinkAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: "docs/missing" });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });

  it("resolves an existing target under the root", async () => {
    const target = path.join(rootDir, "docs");
    const fs = createWorkspaceFilesystem({ rootDir, existingPaths: [target] });

    const outcome = await prepareLinkAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: "docs" });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.targetPath).toBe(target);
  });
});
