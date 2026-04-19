import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";

describe("RunArrangeSyncUseCaseImpl", () => {
  it("returns NOT_FOUND when the target path does not exist", async () => {
    const cliFs = { existsSync: () => false } as unknown as CliFs;
    const subject = new RunArrangeSyncUseCaseImpl(
      cliFs,
      { scanTarget: vi.fn() },
      { processFile: vi.fn() },
    );
    const outcome = await subject.execute({
      rootDir: "/",
      targetPath: "/missing/path.tsx",
      write: false,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });

  it("returns ok with zero sites when scanner returns no matching files", async () => {
    const cliFs = { existsSync: () => true } as unknown as CliFs;
    const subject = new RunArrangeSyncUseCaseImpl(
      cliFs,
      { scanTarget: vi.fn(() => []) },
      { processFile: vi.fn() },
    );
    const outcome = await subject.execute({ rootDir: "/", targetPath: "/empty-dir", write: false });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.totalFound).toBe(0);
    expect(outcome.value.totalChanged).toBe(0);
    expect(outcome.value.filePaths).toEqual([]);
    expect(outcome.value.modifiedFiles).toEqual([]);
    expect(outcome.value.hookError).toBeNull();
  });
});
