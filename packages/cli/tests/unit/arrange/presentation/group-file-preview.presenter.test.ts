import type { Mock } from "vitest";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { GroupFileWorkPlan } from "#/lib/arrange/domain/arrange-grouping.service";
import { DomainSyntaxKind } from "#/lib/arrange/domain/ast/ast-node.model";
import type {
  DomainAstNode,
  DomainCallExpression,
  DomainSourceFile,
} from "#/lib/arrange/domain/ast/ast-node.model";
import type { PlannedGroupEdit } from "#/lib/arrange/domain/types.domain";
import {
  printGroupFilePreview,
  printGroupFilePreviewFromWork,
} from "#/lib/arrange/presentation/group-file-preview.presenter";

function nodeBase(pos: number, end: number, parent: null) {
  return { pos, end, parent } as const;
}

function firstStringArg(args: readonly unknown[]): string {
  const value = args[0];
  return typeof value === "string" ? value : "";
}

describe("group file preview", () => {
  it("prints header with cn-in-tv no-replacement note when count is positive", () => {
    const sourceText = "line1\n";
    const domainSf: DomainSourceFile = { fileName: "x.tsx", text: sourceText, statements: [] };
    const loggerOut: Mock<(message: string) => void> = vi.fn();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn() };

    printGroupFilePreview(mockLogger, {
      filePath: "/pkg/a.tsx",
      reportTotal: 2,
      cnInTvNoReplacement: 1,
      cnInTvCalls: [],
      unwrapReplacementByCall: new Map(),
      sourceText,
      domainSf,
      unwrapEdits: [],
      plannedGroupEdits: [],
    });

    expect(loggerOut).toHaveBeenCalled();
    const header = String(loggerOut.mock.calls[0]?.[0] ?? "");
    expect(header).toContain("cn() inside tv left unchanged");
  });

  it("skips cn-in-tv line when replacement is missing from the map", () => {
    const sourceText = "x";
    const domainSf: DomainSourceFile = { fileName: "x.tsx", text: sourceText, statements: [] };
    const call: DomainCallExpression = {
      ...nodeBase(0, 1, null),
      kind: DomainSyntaxKind.CallExpression,
      expression: {} as DomainAstNode,
      arguments: [],
    };
    const loggerOut: Mock<(message: string) => void> = vi.fn();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn() };

    printGroupFilePreview(mockLogger, {
      filePath: "/pkg/a.tsx",
      reportTotal: 1,
      cnInTvNoReplacement: 0,
      cnInTvCalls: [call],
      unwrapReplacementByCall: new Map(),
      sourceText,
      domainSf,
      unwrapEdits: [],
      plannedGroupEdits: [],
    });

    const lines = loggerOut.mock.calls.map(firstStringArg);
    expect(lines.some((line: string) => line.includes("has no arguments"))).toBe(true);
  });

  it("does not print replacement when source already matches replacement text", () => {
    const sourceText = 'cn("a")';
    const domainSf: DomainSourceFile = { fileName: "x.tsx", text: sourceText, statements: [] };
    const call: DomainCallExpression = {
      ...nodeBase(0, sourceText.length, null),
      kind: DomainSyntaxKind.CallExpression,
      expression: {} as DomainAstNode,
      arguments: [],
    };
    const loggerOut: Mock<(message: string) => void> = vi.fn();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn() };
    const unwrapReplacementByCall = new Map<DomainCallExpression, string>([[call, sourceText]]);

    printGroupFilePreview(mockLogger, {
      filePath: "/pkg/a.tsx",
      reportTotal: 1,
      cnInTvNoReplacement: 0,
      cnInTvCalls: [call],
      unwrapReplacementByCall,
      sourceText,
      domainSf,
      unwrapEdits: [],
      plannedGroupEdits: [],
    });

    const lines = loggerOut.mock.calls.map(firstStringArg);
    expect(lines.some((line: string) => line.includes("[tv ⊃ cn → string/array]"))).toBe(false);
  });

  it("prints unwrap/plan hint when both unwrap edits and planned group edits exist", () => {
    const sourceText = "src";
    const domainSf: DomainSourceFile = { fileName: "x.tsx", text: sourceText, statements: [] };
    const loggerOut: Mock<(message: string) => void> = vi.fn();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn() };
    const planned: PlannedGroupEdit = {
      start: 0,
      end: 1,
      replacement: "y",
      bucketSummary: ["existence"],
      jsxCn: false,
      lineSf: domainSf,
      reportNode: {
        ...nodeBase(0, 1, null),
        kind: DomainSyntaxKind.Identifier,
        text: "x",
      },
      label: "[cn]",
    };

    printGroupFilePreview(mockLogger, {
      filePath: "/pkg/a.tsx",
      reportTotal: 2,
      cnInTvNoReplacement: 0,
      cnInTvCalls: [],
      unwrapReplacementByCall: new Map(),
      sourceText,
      domainSf,
      unwrapEdits: [
        {
          start: 0,
          end: 1,
          replacement: "z",
          call: {
            ...nodeBase(0, 1, null),
            kind: DomainSyntaxKind.CallExpression,
            expression: {} as DomainAstNode,
            arguments: [],
          },
        },
      ],
      plannedGroupEdits: [planned],
    });

    const lines = loggerOut.mock.calls.map(firstStringArg);
    expect(lines.some((line: string) => line.includes("[cn] / [tv] / [JSX className]"))).toBe(true);
  });

  it("delegates printGroupFilePreviewFromWork to printGroupFilePreview with work fields", () => {
    const sourceText = "src";
    const domainSf: DomainSourceFile = { fileName: "x.tsx", text: sourceText, statements: [] };
    const loggerOut: Mock<(message: string) => void> = vi.fn();
    const mockLogger: CliLogger = { out: loggerOut, err: vi.fn() };
    const work = {
      filePath: "/w.tsx",
      sourceText,
      textAfterUnwrap: sourceText,
      domainSfForLineNumbers: domainSf,
      domainSfGrouped: domainSf,
      cnInTvCalls: [],
      unwrapReplacementByCall: new Map(),
      unwrapEdits: [],
      plannedGroupEdits: [],
      cnInTvNoReplacement: 0,
      reportTotal: 0,
      editSitesCount: 0,
    } satisfies GroupFileWorkPlan;

    printGroupFilePreviewFromWork(mockLogger, work);

    expect(loggerOut).toHaveBeenCalled();
    const header = String(loggerOut.mock.calls[0]?.[0] ?? "");
    expect(header).toContain("/w.tsx");
  });
});
