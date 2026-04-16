import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import { AnalyzeDirectoryUseCaseImpl } from "#lib/arrange/application/use-cases/analyze-directory.use-case";
import type { DomainSourceFile } from "#lib/arrange/domain/ast/ast-node.model";

function emptyDomainSourceFile(fileName: string): DomainSourceFile {
  return {
    fileName,
    statements: [],
  } as unknown as DomainSourceFile;
}

describe("analyzeDirectory use case", () => {
  it("returns ok with aggregated report for a single file target", () => {
    const mockFs = {
      statSync: vi.fn<(...args: unknown[]) => unknown>(() => ({ isDirectory: () => false })),
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(() => "export const x = 1;"),
    };
    const mockTargetScanner = {
      scanTarget: vi.fn<(...args: unknown[]) => unknown>(() => ["/src/one.ts"]),
    };
    const mockParser = {
      parseDomainSourceFile: vi.fn<(...args: unknown[]) => unknown>(() =>
        emptyDomainSourceFile("/src/one.ts"),
      ),
    };
    const subject = new AnalyzeDirectoryUseCaseImpl(
      mockFs as unknown as CliFs,
      mockTargetScanner,
      mockParser,
    );
    const outcome = subject.execute({ analyzeRootPath: "/src/one.ts" });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.files).toBe(1);
    expect(mockTargetScanner.scanTarget).toHaveBeenCalledWith({
      targetPath: "/src/one.ts",
      fs: mockFs,
    });
    expect(mockFs.readFileSync).toHaveBeenCalledWith("/src/one.ts", "utf8");
  });

  it("walks directory targets before reading each file", () => {
    const mockFs = {
      statSync: vi.fn<(...args: unknown[]) => unknown>(() => ({ isDirectory: () => true })),
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(() => ""),
    };
    const mockTargetScanner = {
      scanTarget: vi.fn<(...args: unknown[]) => unknown>(() => ["/pkg/a.ts", "/pkg/b.ts"]),
    };
    const mockParser = {
      parseDomainSourceFile: vi.fn<(...args: unknown[]) => unknown>((filePath: string) =>
        emptyDomainSourceFile(filePath),
      ),
    };
    const subject = new AnalyzeDirectoryUseCaseImpl(
      mockFs as unknown as CliFs,
      mockTargetScanner,
      mockParser,
    );
    const outcome = subject.execute({ analyzeRootPath: "/pkg" });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.files).toBe(2);
    expect(mockTargetScanner.scanTarget).toHaveBeenCalledWith({
      targetPath: "/pkg",
      fs: mockFs,
    });
  });

  it("returns INFRA_FAILURE when the filesystem throws", () => {
    const mockFs = {
      statSync: vi.fn<(...args: unknown[]) => unknown>(() => {
        throw new Error("disk unavailable");
      }),
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(),
    };
    const subject = new AnalyzeDirectoryUseCaseImpl(
      mockFs as unknown as CliFs,
      { scanTarget: vi.fn<(...args: unknown[]) => unknown>() },
      { parseDomainSourceFile: vi.fn<(...args: unknown[]) => unknown>() },
    );
    const outcome = subject.execute({ analyzeRootPath: "/any" });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
