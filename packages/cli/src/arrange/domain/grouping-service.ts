/**
 * Rich domain: plan Tailwind class grouping / cn-in-tv unwrap for a single file.
 * Pure: only DomainSourceFile, source strings, and options — no I/O.
 */

import type { GroupFileResult, PlannedGroupEdit } from "#/arrange/domain/types";
import {
  applyEditsDescending,
  buildKnownCnTvBindings,
  unwrapCnInsideTvCallReplacement,
} from "#/arrange/domain/ast/helpers";
import { listAllCnCallsInsideTvInSourceFile } from "#/arrange/domain/ast/collectors-tv";
import {
  collectGroupTargets,
  planGroupEditForTarget,
  targetReplaceStart,
} from "#/arrange/domain/ast/targets";
import type { DomainCallExpression, DomainSourceFile } from "#/arrange/domain/ast/ast-node";

/**
 * @since 0.3.16-canary.0
 */
export type GroupFileUnwrapPlan = {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
  readonly call: DomainCallExpression;
};

type GroupFileUnwrapState = {
  readonly cnInTvCalls: ReadonlyArray<DomainCallExpression>;
  readonly unwrapReplacementByCall: ReadonlyMap<DomainCallExpression, string>;
  readonly unwrapEdits: ReadonlyArray<GroupFileUnwrapPlan>;
  readonly textAfterUnwrap: string;
  readonly cnInTvNoReplacement: number;
};

/**
 * @since 0.3.16-canary.0
 */
export type GroupFileWorkPlan = {
  readonly filePath: string;
  readonly sourceText: string;
  readonly textAfterUnwrap: string;
  readonly domainSfForLineNumbers: DomainSourceFile;
  readonly domainSfGrouped: DomainSourceFile;
  readonly cnInTvCalls: ReadonlyArray<DomainCallExpression>;
  readonly unwrapReplacementByCall: ReadonlyMap<DomainCallExpression, string>;
  readonly unwrapEdits: ReadonlyArray<GroupFileUnwrapPlan>;
  readonly plannedGroupEdits: ReadonlyArray<PlannedGroupEdit>;
  readonly cnInTvNoReplacement: number;
  readonly reportTotal: number;
  readonly editSitesCount: number;
};

function toUnwrapPlans(
  cnInTvCalls: ReadonlyArray<DomainCallExpression>,
  sourceText: string,
): Array<GroupFileUnwrapPlan> {
  return cnInTvCalls
    .map((call): GroupFileUnwrapPlan | undefined => {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText);
      if (replacement === undefined) {
        return undefined;
      }
      return { start: call.pos, end: call.end, replacement, call };
    })
    .filter((plan): plan is GroupFileUnwrapPlan => plan !== undefined);
}

/**
 * @since 0.3.16-canary.0
 */
export function buildGroupFileUnwrapState(
  domainSfInitial: DomainSourceFile,
  sourceText: string,
): GroupFileUnwrapState {
  const knownBindings = buildKnownCnTvBindings(domainSfInitial);
  const cnInTvCalls = listAllCnCallsInsideTvInSourceFile(domainSfInitial, knownBindings);
  const unwrapPlans = toUnwrapPlans(cnInTvCalls, sourceText);
  const unwrapReplacementByCall = new Map(
    unwrapPlans.map((unwrapPlan) => [unwrapPlan.call, unwrapPlan.replacement] as const),
  );
  const unwrapEdits = unwrapPlans.filter(
    (unwrapPlan) => sourceText.slice(unwrapPlan.start, unwrapPlan.end) !== unwrapPlan.replacement,
  );
  const textAfterUnwrap =
    unwrapEdits.length > 0 ? applyEditsDescending(sourceText, [...unwrapEdits]) : sourceText;
  const cnInTvNoReplacement = cnInTvCalls.length - unwrapPlans.length;
  return {
    cnInTvCalls,
    unwrapReplacementByCall,
    unwrapEdits,
    textAfterUnwrap,
    cnInTvNoReplacement,
  };
}

/**
 * `domainSfGrouped` must be a parse of `unwrap.textAfterUnwrap` (same `text` as source).
 * Returns `null` when there is no cn-in-tv and no grouping targets.
 *
 * @since 0.3.16-canary.0
 */
export function tryBuildGroupFileWorkPlan(input: {
  readonly filePath: string;
  readonly sourceText: string;
  readonly domainSfInitial: DomainSourceFile;
  readonly domainSfGrouped: DomainSourceFile;
  readonly withClassName: boolean;
  readonly unwrap: GroupFileUnwrapState;
}): GroupFileWorkPlan | null {
  const { filePath, sourceText, domainSfInitial, domainSfGrouped, withClassName, unwrap } = input;

  if (domainSfGrouped.text !== unwrap.textAfterUnwrap) {
    throw new Error(
      "Domain invariant: domainSfGrouped.text must match unwrap phase textAfterUnwrap",
    );
  }

  const groupTargets = collectGroupTargets(domainSfGrouped, filePath);

  if (unwrap.cnInTvCalls.length === 0 && groupTargets.length === 0) {
    return null;
  }

  const sortedTargets = [...groupTargets].sort(
    (leftTarget, rightTarget) => targetReplaceStart(rightTarget) - targetReplaceStart(leftTarget),
  );
  const plannedGroupEdits: Array<PlannedGroupEdit> = [];
  for (const groupTarget of sortedTargets) {
    const plan = planGroupEditForTarget(groupTarget, unwrap.textAfterUnwrap, withClassName);
    if (plan === undefined) {
      continue;
    }
    if (unwrap.textAfterUnwrap.slice(plan.start, plan.end) === plan.replacement) {
      continue;
    }
    plannedGroupEdits.push(plan);
  }

  const editSitesCount = unwrap.unwrapEdits.length + plannedGroupEdits.length;
  const reportTotal = editSitesCount + unwrap.cnInTvNoReplacement;

  return {
    filePath,
    sourceText,
    textAfterUnwrap: unwrap.textAfterUnwrap,
    domainSfForLineNumbers: domainSfInitial,
    domainSfGrouped,
    cnInTvCalls: unwrap.cnInTvCalls,
    unwrapReplacementByCall: unwrap.unwrapReplacementByCall,
    unwrapEdits: unwrap.unwrapEdits,
    plannedGroupEdits,
    cnInTvNoReplacement: unwrap.cnInTvNoReplacement,
    reportTotal,
    editSitesCount,
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function groupFileDryRunNoEdits(filePath: string): GroupFileResult {
  return { filePath, totalFound: 0, changed: 0 };
}

/**
 * @since 0.3.16-canary.0
 */
export function groupFilePreviewTotals(work: GroupFileWorkPlan): GroupFileResult {
  return {
    filePath: work.filePath,
    totalFound: work.reportTotal,
    changed: 0,
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function mergeGroupFileBodyText(work: GroupFileWorkPlan): string {
  const groupEdits = work.plannedGroupEdits.map((plannedEdit) => ({
    start: plannedEdit.start,
    end: plannedEdit.end,
    replacement: plannedEdit.replacement,
    jsxCn: plannedEdit.jsxCn,
  }));

  return groupEdits.length > 0
    ? applyEditsDescending(work.textAfterUnwrap, groupEdits)
    : work.textAfterUnwrap;
}

/**
 * @since 0.3.16-canary.0
 */
export function groupFileEditsTouchJsxCn(work: GroupFileWorkPlan): boolean {
  return work.plannedGroupEdits.some((plannedEdit) => plannedEdit.jsxCn);
}

/**
 * @since 0.3.16-canary.0
 */
export function countPersistedGroupFileEdits(work: GroupFileWorkPlan): number {
  return work.unwrapEdits.length + work.plannedGroupEdits.length;
}

/**
 * @since 0.3.16-canary.0
 */
export function groupFileWorkHasNothingToReport(work: GroupFileWorkPlan): boolean {
  return work.editSitesCount === 0 && work.cnInTvNoReplacement === 0;
}
