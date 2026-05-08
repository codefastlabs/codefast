import path from "node:path";
import { logger } from "#/core/logger";
import { LONG_STRING_TOKEN_THRESHOLD, MAX_REPORT_LINES } from "#/arrange/domain/constants";
import type { AnalyzeReport, ArrangeRunResult, PlannedGroupEdit } from "#/arrange/domain/types";
import type { GroupFileUnwrapPlan, GroupFileWorkPlan } from "#/arrange/domain/grouping-service";
import { lineOf } from "#/arrange/domain/ast/helpers";
import type { DomainCallExpression, DomainSourceFile } from "#/arrange/domain/ast/ast-node";

/**
 * @since 0.3.16-canary.0
 */
export function printAnalyzeReport(resolvedTargetPath: string, report: AnalyzeReport): void {
  logger.out(`Path: ${path.resolve(resolvedTargetPath)}`);
  logger.out(`.ts/.tsx files: ${report.files}`);
  logger.out(`cn(...) call sites: ${report.cnCallExpressions}`);
  logger.out(`tv(...) call sites: ${report.tvCallExpressions}`);
  logger.out(
    `\nLong cn(...) string literals (≥${LONG_STRING_TOKEN_THRESHOLD} tokens — consider splitting arguments): ${report.longCnStringLiterals.length}`,
  );
  for (const findingEntry of report.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (report.longCnStringLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${report.longCnStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\nLong tv({...}) string literals in base/variants/… (≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${report.longTvStringLiterals.length}`,
  );
  for (const findingEntry of report.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (report.longTvStringLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${report.longTvStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\nJSX className="..." or className={'...'} (static strings, ≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${report.longJsxClassNameLiterals.length}`,
  );
  for (const findingEntry of report.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (report.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${report.longJsxClassNameLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\ncn(...) nested inside tv({...}) (prefer a string or array — preview/apply can rewrite): ${report.cnInsideTvCalls.length}`,
  );
  for (const findingEntry of report.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.argCount} args)  ${findingEntry.preview}`,
    );
  }
  if (report.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${report.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function printSyncResult(result: ArrangeRunResult, write: boolean): void {
  logger.out(
    `\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (write) {
    logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
  } else {
    logger.out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }
  const shouldShowCascadeHint = write ? result.totalChanged > 0 : result.totalFound > 0;
  if (shouldShowCascadeHint) {
    logger.out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }
  if (result.hookError !== null) {
    logger.err(result.hookError);
  }
}

/**
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
    logger.out(
      "  ([cn] / [tv] / [JSX className] lines below reflect content after unwrap of cn inside tv.)",
    );
  }
  for (const plan of plannedGroupEdits) {
    logger.out(`  Line ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
    logger.out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    logger.out(`  // Buckets: ${JSON.stringify(plan.bucketSummary)}`);
  }
}
