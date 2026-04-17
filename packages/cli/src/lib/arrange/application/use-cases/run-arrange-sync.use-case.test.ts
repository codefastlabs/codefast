import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import type { ArrangeFileProcessorService, ArrangeTargetScannerService } from "#/lib/tokens";

describe("RunArrangeSyncUseCaseImpl", () => {
  it("returns NOT_FOUND when the target path does not exist", async () => {
    const cliFs = {
      existsSync: () => false,
    } as unknown as CliFs;
    const cliLogger = {
      out: vi.fn<(message: string) => void>(),
      err: vi.fn<(message: string) => void>(),
    } as CliLogger;
    const targetScanner = { scanTarget: vi.fn<ArrangeTargetScannerService["scanTarget"]>() };
    const fileProcessor = { processFile: vi.fn<ArrangeFileProcessorService["processFile"]>() };
    const subject = new RunArrangeSyncUseCaseImpl(cliFs, cliLogger, targetScanner, fileProcessor);
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
    const cliFs = {
      existsSync: () => true,
    } as unknown as CliFs;
    const cliLogger = {
      out: vi.fn<(message: string) => void>(),
      err: vi.fn<(message: string) => void>(),
    } as CliLogger;
    const targetScanner = {
      scanTarget: vi.fn<ArrangeTargetScannerService["scanTarget"]>(() => []),
    };
    const fileProcessor = { processFile: vi.fn<ArrangeFileProcessorService["processFile"]>() };
    const subject = new RunArrangeSyncUseCaseImpl(cliFs, cliLogger, targetScanner, fileProcessor);
    const outcome = await subject.execute({ rootDir: "/", targetPath: "/empty-dir", write: false });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value).toBe(0);
  });
});
