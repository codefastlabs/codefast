import path from "node:path";

import { LONG_STRING_TOKEN_THRESHOLD, MAX_REPORT_LINES } from "#/arrange/domain/constants";
import type { AnalyzeReport } from "#/arrange/domain/types";
import { logger } from "#/core/logger";

/**
 * Prints the human-readable summary of an `arrange inspect` report.
 *
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
    logger.out(`  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.argCount} args)  ${findingEntry.preview}`);
  }
  if (report.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${report.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
  }
}
