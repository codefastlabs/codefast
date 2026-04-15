import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import { nodeCliPath } from "#lib/core/infra/path.adapter";
import { runOnTarget } from "#lib/arrange/application/use-cases/run-arrange-sync.use-case";

describe("runOnTarget use case", () => {
  it("returns NOT_FOUND when the target path does not exist", () => {
    const outcome = runOnTarget(
      { targetPath: "/missing/path.tsx", write: false },
      {
        fs: {
          existsSync: () => false,
        } as unknown as CliFs,
        logger: { out: jest.fn(), err: jest.fn() },
        path: nodeCliPath,
        fileWalker: { walkTypeScriptFiles: jest.fn() },
        domainSourceParser: { parseDomainSourceFile: jest.fn() },
        groupFilePreview: { printGroupFilePreviewFromWork: jest.fn() },
      },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });

  it("returns ok with zero sites when the directory has no matching files", () => {
    const outcome = runOnTarget(
      { targetPath: "/empty-dir", write: false },
      {
        fs: {
          existsSync: () => true,
          statSync: () => ({ isDirectory: () => true }),
        } as unknown as CliFs,
        logger: { out: jest.fn(), err: jest.fn() },
        path: nodeCliPath,
        fileWalker: { walkTypeScriptFiles: () => [] },
        domainSourceParser: { parseDomainSourceFile: jest.fn() },
        groupFilePreview: { printGroupFilePreviewFromWork: jest.fn() },
      },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.totalFound).toBe(0);
    expect(outcome.value.filePaths).toEqual([]);
  });
});
