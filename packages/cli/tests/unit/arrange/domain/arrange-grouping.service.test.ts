import {
  buildGroupFileUnwrapState,
  countPersistedGroupFileEdits,
  groupFileDryRunNoEdits,
  groupFileEditsTouchJsxCn,
  groupFilePreviewTotals,
  groupFileWorkHasNothingToReport,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#/lib/arrange/domain/arrange-grouping.service";
import type { GroupFileWorkPlan } from "#/lib/arrange/domain/arrange-grouping.service";
import { DomainSyntaxKind } from "#/lib/arrange/domain/ast/ast-node.model";
import type {
  DomainCallExpression,
  DomainSourceFile,
} from "#/lib/arrange/domain/ast/ast-node.model";
import type { PlannedGroupEdit } from "#/lib/arrange/domain/types.domain";

const emptySourceFile = (fileName: string, text: string): DomainSourceFile => ({
  fileName,
  text,
  statements: [],
});

const dummyCallExpression: DomainCallExpression = {
  kind: DomainSyntaxKind.CallExpression,
  pos: 0,
  end: 1,
  parent: null,
  expression: {
    kind: DomainSyntaxKind.Identifier,
    pos: 0,
    end: 1,
    parent: null,
    text: "cn",
  },
  arguments: [],
};

function minimalWorkPlan(overrides: Partial<GroupFileWorkPlan>): GroupFileWorkPlan {
  const base: GroupFileWorkPlan = {
    filePath: "x.tsx",
    sourceText: "",
    textAfterUnwrap: "body",
    domainSfForLineNumbers: emptySourceFile("x.tsx", ""),
    domainSfGrouped: emptySourceFile("x.tsx", "body"),
    cnInTvCalls: [],
    unwrapReplacementByCall: new Map(),
    unwrapEdits: [],
    plannedGroupEdits: [],
    cnInTvNoReplacement: 0,
    reportTotal: 0,
    editSitesCount: 0,
  };
  return { ...base, ...overrides };
}

describe("arrange-grouping.service", () => {
  it("mergeGroupFileBodyText applies group edits on textAfterUnwrap", () => {
    const work = minimalWorkPlan({
      textAfterUnwrap: "aaaMIDDLEbbb",
      plannedGroupEdits: [
        {
          start: 3,
          end: 9,
          replacement: "REPL",
          bucketSummary: [],
          jsxCn: false,
          lineSf: emptySourceFile("x.tsx", ""),
          reportNode: {
            kind: DomainSyntaxKind.StringLiteral,
            pos: 0,
            end: 1,
            parent: null,
            text: "",
          },
          label: "cn",
        } as PlannedGroupEdit,
      ],
    });
    expect(mergeGroupFileBodyText(work)).toBe("aaaREPLbbb");
  });

  it("groupFileEditsTouchJsxCn is true when any planned edit is jsx cn", () => {
    const work = minimalWorkPlan({
      plannedGroupEdits: [
        {
          start: 0,
          end: 1,
          replacement: "x",
          bucketSummary: [],
          jsxCn: true,
          lineSf: emptySourceFile("x.tsx", ""),
          reportNode: {
            kind: DomainSyntaxKind.StringLiteral,
            pos: 0,
            end: 1,
            parent: null,
            text: "",
          },
          label: "jsx",
        } as PlannedGroupEdit,
      ],
    });
    expect(groupFileEditsTouchJsxCn(work)).toBe(true);
  });

  it("countPersistedGroupFileEdits sums unwrap and group edits", () => {
    const work = minimalWorkPlan({
      unwrapEdits: [{ start: 0, end: 1, replacement: "a", call: dummyCallExpression }],
      plannedGroupEdits: [
        {
          start: 1,
          end: 2,
          replacement: "b",
          bucketSummary: [],
          jsxCn: false,
          lineSf: emptySourceFile("x.tsx", ""),
          reportNode: {
            kind: DomainSyntaxKind.StringLiteral,
            pos: 0,
            end: 1,
            parent: null,
            text: "",
          },
          label: "cn",
        } as PlannedGroupEdit,
      ],
    });
    expect(countPersistedGroupFileEdits(work)).toBe(2);
  });

  it("groupFileWorkHasNothingToReport respects edit sites and skipped cn-in-tv", () => {
    expect(
      groupFileWorkHasNothingToReport(
        minimalWorkPlan({ editSitesCount: 0, cnInTvNoReplacement: 0 }),
      ),
    ).toBe(true);
    expect(
      groupFileWorkHasNothingToReport(
        minimalWorkPlan({ editSitesCount: 0, cnInTvNoReplacement: 1 }),
      ),
    ).toBe(false);
  });

  it("groupFileDryRunNoEdits and groupFilePreviewTotals", () => {
    expect(groupFileDryRunNoEdits("p.tsx")).toEqual({
      filePath: "p.tsx",
      totalFound: 0,
      changed: 0,
    });
    const work = minimalWorkPlan({ filePath: "q.tsx", reportTotal: 4 });
    expect(groupFilePreviewTotals(work)).toEqual({
      filePath: "q.tsx",
      totalFound: 4,
      changed: 0,
    });
  });

  it("tryBuildGroupFileWorkPlan returns null when there is no tv-cn and no group targets", () => {
    const sourceText = "export const x = 1;\n";
    const sf = emptySourceFile("a.tsx", sourceText);
    const unwrap = buildGroupFileUnwrapState(sf, sourceText);
    expect(
      tryBuildGroupFileWorkPlan({
        filePath: "a.tsx",
        sourceText,
        domainSfInitial: sf,
        domainSfGrouped: sf,
        withClassName: false,
        unwrap,
      }),
    ).toBeNull();
  });

  it("tryBuildGroupFileWorkPlan throws when grouped source text disagrees with unwrap phase", () => {
    const sourceText = "export const x = 1;\n";
    const sf = emptySourceFile("a.tsx", sourceText);
    const unwrap = buildGroupFileUnwrapState(sf, sourceText);
    const wrongGrouped = emptySourceFile("a.tsx", "different");
    expect(() =>
      tryBuildGroupFileWorkPlan({
        filePath: "a.tsx",
        sourceText,
        domainSfInitial: sf,
        domainSfGrouped: wrongGrouped,
        withClassName: false,
        unwrap,
      }),
    ).toThrow(/invariant/i);
  });
});
