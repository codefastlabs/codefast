import type { Mock } from "vitest";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import { groupFile } from "#/lib/arrange/application/use-cases/group-file.use-case";
import { domainSourceParserAdapter } from "#/lib/arrange/infra/domain-source-parser.adapter";
import { groupFilePreviewPresenter } from "#/lib/arrange/presentation/group-file-preview.presenter";

function createForwardingParserPort(): DomainSourceParserPort {
  return {
    parseDomainSourceFile: vi.fn<(...args: unknown[]) => unknown>(
      (filePath: string, sourceText: string) =>
        domainSourceParserAdapter.parseDomainSourceFile(filePath, sourceText),
    ),
  };
}

describe("groupFile use case", () => {
  it("returns zero totals when there is no cn/tv work in the file", () => {
    const filePath = "/virtual/no-cn.ts";
    const sourceText = `export const x = 1;\n`;
    const mockFs = {
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(() => sourceText),
      writeFileSync: vi.fn<(...args: unknown[]) => unknown>(),
    } as unknown as CliFs;
    const loggerOut: Mock<(message: string) => void> = vi.fn<(...args: unknown[]) => unknown>();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn<(...args: unknown[]) => unknown>() };
    const domainSourceParser = createForwardingParserPort();

    const outcome = groupFile(
      filePath,
      { write: false, withClassName: false },
      mockFs,
      mockLogger,
      domainSourceParser,
      groupFilePreviewPresenter,
    );

    expect(outcome.filePath).toBe(filePath);
    expect(outcome.totalFound).toBe(0);
    expect(outcome.changed).toBe(0);
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    expect(loggerOut).not.toHaveBeenCalled();
  });

  it("prints preview and does not write when write is false and edits exist", () => {
    const sourceText = `import { cn, tv } from "@codefast/tailwind-variants";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium"),
});
`;
    const filePath = "/virtual/preview.tsx";
    const mockFs = {
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(() => sourceText),
      writeFileSync: vi.fn<(...args: unknown[]) => unknown>(),
    } as unknown as CliFs;
    const loggerOut: Mock<(message: string) => void> = vi.fn<(...args: unknown[]) => unknown>();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn<(...args: unknown[]) => unknown>() };
    const domainSourceParser = createForwardingParserPort();

    const outcome = groupFile(
      filePath,
      { write: false, withClassName: false },
      mockFs,
      mockLogger,
      domainSourceParser,
      groupFilePreviewPresenter,
    );

    expect(outcome.changed).toBe(0);
    expect(outcome.totalFound).toBeGreaterThan(0);
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    expect(loggerOut).toHaveBeenCalled();
    const firstBanner = String(loggerOut.mock.calls[0]?.[0] ?? "");
    expect(firstBanner).toContain(filePath);
  });

  it("writes the file when write is true and persisted edits exist", () => {
    const sourceText = `import { cn, tv } from "@codefast/tailwind-variants";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium"),
});
`;
    const filePath = "/virtual/apply.tsx";
    const mockFs = {
      readFileSync: vi.fn<(...args: unknown[]) => unknown>(() => sourceText),
      writeFileSync: vi.fn<(...args: unknown[]) => unknown>(),
    } as unknown as CliFs;
    const loggerOut: Mock<(message: string) => void> = vi.fn<(...args: unknown[]) => unknown>();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn<(...args: unknown[]) => unknown>() };
    const domainSourceParser = createForwardingParserPort();

    const outcome = groupFile(
      filePath,
      { write: true, withClassName: false },
      mockFs,
      mockLogger,
      domainSourceParser,
      groupFilePreviewPresenter,
    );

    expect(outcome.changed).toBeGreaterThan(0);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, expect.any(String), "utf8");
  });
});
