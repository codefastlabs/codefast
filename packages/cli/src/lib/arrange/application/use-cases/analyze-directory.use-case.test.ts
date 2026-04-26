import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { AnalyzeDirectoryUseCaseImpl } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import type { DomainSourceFile } from "#/lib/arrange/domain/ast/ast-node.model";

function emptyDomainSourceFile(fileName: string): DomainSourceFile {
  return {
    fileName,
    statements: [],
  } as unknown as DomainSourceFile;
}

describe("analyzeDirectory use case", () => {
  it("returns ok with aggregated report for a single file target", () => {
    const mockFs = {
      statSync: vi.fn(() => ({ isDirectory: () => false })),
      readFileSync: vi.fn(() => "export const x = 1;"),
    };
    const mockTargetScanner = {
      scanTarget: vi.fn(() => ["/src/one.ts"]),
    };
    const mockParser = {
      parseDomainSourceFile: vi.fn(() => emptyDomainSourceFile("/src/one.ts")),
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
    });
    expect(mockFs.readFileSync).toHaveBeenCalledWith("/src/one.ts", "utf8");
  });

  it("walks directory targets before reading each file", () => {
    const mockFs = {
      statSync: vi.fn(() => ({ isDirectory: () => true })),
      readFileSync: vi.fn(() => ""),
    };
    const mockTargetScanner = {
      scanTarget: vi.fn(() => ["/pkg/a.ts", "/pkg/b.ts"]),
    };
    const mockParser = {
      parseDomainSourceFile: vi.fn((filePath: string) => emptyDomainSourceFile(filePath)),
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
    });
  });

  it("returns INFRA_FAILURE when the filesystem throws", () => {
    const mockFs = {
      statSync: vi.fn(() => {
        throw new Error("disk unavailable");
      }),
      readFileSync: vi.fn(),
    };
    const subject = new AnalyzeDirectoryUseCaseImpl(
      mockFs as unknown as CliFs,
      { scanTarget: vi.fn() },
      { parseDomainSourceFile: vi.fn() },
    );
    const outcome = subject.execute({ analyzeRootPath: "/any" });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
