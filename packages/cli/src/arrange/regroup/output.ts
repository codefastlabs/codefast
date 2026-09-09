import type { DomainCallExpression, DomainSourceFile } from "#/arrange/domain/ast/ast-node";
import { lineOf } from "#/arrange/domain/ast/helpers";
import type { GroupFileUnwrapPlan, GroupFileWorkPlan } from "#/arrange/domain/grouping-service";
import type { ArrangeRunResult, PlannedGroupEdit } from "#/arrange/domain/types";
import { logger } from "#/core/logger";

/**
 * Prints the totals and follow-up hints for an `arrange` run.
 *
 * @since 0.3.16-canary.0
 */
export function printArrangeResult(result: ArrangeRunResult, write: boolean): void {
  logger.out(
    `\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (write) {
    logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
  } else {
    logger.out(`(Re-run without --dry-run to write changes, or "pnpm cli:arrange" / "pnpm exec codefast arrange")`);
  }
  const shouldShowCascadeHint = write ? result.totalChanged > 0 : result.totalFound > 0;
  if (shouldShowCascadeHint) {
    logger.out("Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.");
  }
  if (result.hookError !== null) {
    logger.err(result.hookError);
  }
}

/**
 * Prints the per-file preview of a work plan's unwrap and grouping edits.
 *
 * @since 0.3.16-canary.0
 */
export function printGroupFilePreviewFromWork(work: GroupFileWorkPlan): void {
  printGroupFilePreviewBody({
    filePath: work.filePath,
    reportTotal: work.reportTotal,
    cnInTvNoReplacement: work.cnInTvNoReplacement,
    cnInTvCalls: work.cnInTvCalls,
    unwrapReplacementByCall: work.unwrapReplacementByCall,
    sourceText: work.sourceText,
    domainSf: work.domainSfForLineNumbers,
    unwrapEdits: work.unwrapEdits,
    plannedGroupEdits: work.plannedGroupEdits,
  });
}

function printGroupFilePreviewBody(args: {
  filePath: string;
  reportTotal: number;
  cnInTvNoReplacement: number;
  cnInTvCalls: ReadonlyArray<DomainCallExpression>;
  unwrapReplacementByCall: ReadonlyMap<DomainCallExpression, string>;
  sourceText: string;
  domainSf: DomainSourceFile;
  unwrapEdits: ReadonlyArray<GroupFileUnwrapPlan>;
  plannedGroupEdits: ReadonlyArray<PlannedGroupEdit>;
}): void {
  const {
    filePath,
    reportTotal,
    cnInTvNoReplacement,
    cnInTvCalls,
    unwrapReplacementByCall,
    sourceText,
    domainSf,
    unwrapEdits,
    plannedGroupEdits,
  } = args;

  let header = `\n── ${filePath} (${reportTotal} site(s)`;
  if (cnInTvNoReplacement > 0) {
    header += `; plus ${cnInTvNoReplacement} cn() inside tv left unchanged (0 args)`;
  }
  header += `) ──`;
  logger.out(header);

  for (const call of cnInTvCalls) {
    const replacement = unwrapReplacementByCall.get(call);
    if (replacement === undefined) {
      logger.out(`  Line ${lineOf(domainSf, call)} [tv ⊃ cn]: cn(...) has no arguments — skipped`);
      continue;
    }
    const start = call.pos;
    const end = call.end;
    if (sourceText.slice(start, end) === replacement) {
      continue;
    }
    logger.out(`  Line ${lineOf(domainSf, call)} [tv ⊃ cn → string/array]:`);
    logger.out(`  ${replacement.split("\n").join("\n  ")}`);
  }
  if (unwrapEdits.length > 0 && plannedGroupEdits.length > 0) {
    logger.out("  ([cn] / [tv] / [JSX className] lines below reflect content after unwrap of cn inside tv.)");
  }
  for (const plan of plannedGroupEdits) {
    logger.out(`  Line ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
    logger.out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    logger.out(`  // Buckets: ${JSON.stringify(plan.bucketSummary)}`);
  }
}
