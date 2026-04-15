import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import { analyzeDirectory } from "#lib/arrange/application/use-cases/analyze-directory.use-case";
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
      statSync: jest.fn(() => ({ isDirectory: () => false })),
      readFileSync: jest.fn(() => "export const x = 1;"),
    };
    const mockWalker = {
      walkTypeScriptFiles: jest.fn(),
    };
    const mockParser = {
      parseDomainSourceFile: jest.fn(() => emptyDomainSourceFile("/src/one.ts")),
    };
    const outcome = analyzeDirectory(
      { analyzeRootPath: "/src/one.ts" },
      {
        fs: mockFs as unknown as CliFs,
        fileWalker: mockWalker,
        domainSourceParser: mockParser,
      },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.files).toBe(1);
    expect(mockWalker.walkTypeScriptFiles).not.toHaveBeenCalled();
    expect(mockFs.readFileSync).toHaveBeenCalledWith("/src/one.ts", "utf8");
  });

  it("walks directory targets before reading each file", () => {
    const mockFs = {
      statSync: jest.fn(() => ({ isDirectory: () => true })),
      readFileSync: jest.fn(() => ""),
    };
    const mockWalker = {
      walkTypeScriptFiles: jest.fn(() => ["/pkg/a.ts", "/pkg/b.ts"]),
    };
    const mockParser = {
      parseDomainSourceFile: jest.fn((filePath: string) => emptyDomainSourceFile(filePath)),
    };
    const outcome = analyzeDirectory(
      { analyzeRootPath: "/pkg" },
      {
        fs: mockFs as unknown as CliFs,
        fileWalker: mockWalker,
        domainSourceParser: mockParser,
      },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.files).toBe(2);
    expect(mockWalker.walkTypeScriptFiles).toHaveBeenCalledWith("/pkg", mockFs);
  });

  it("returns INFRA_FAILURE when the filesystem throws", () => {
    const mockFs = {
      statSync: jest.fn(() => {
        throw new Error("disk unavailable");
      }),
      readFileSync: jest.fn(),
    };
    const outcome = analyzeDirectory(
      { analyzeRootPath: "/any" },
      {
        fs: mockFs as unknown as CliFs,
        fileWalker: { walkTypeScriptFiles: jest.fn() },
        domainSourceParser: { parseDomainSourceFile: jest.fn() },
      },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
