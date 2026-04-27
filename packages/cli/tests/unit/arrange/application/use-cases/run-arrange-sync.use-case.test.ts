import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";

describe("RunArrangeSyncUseCaseImpl", () => {
  it("returns ok with zero sites when scanner returns no matching files", async () => {
    const subject = new RunArrangeSyncUseCaseImpl(
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
    expect(outcome.value.previewPlans).toEqual([]);
  });
});
