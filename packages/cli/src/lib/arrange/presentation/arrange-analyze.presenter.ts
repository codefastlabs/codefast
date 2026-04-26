import path from "node:path";
import { inject, injectable } from "@codefast/di";
import {
  LONG_STRING_TOKEN_THRESHOLD,
  MAX_REPORT_LINES,
} from "#/lib/arrange/domain/constants.domain";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/presentation.contract";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";

// ─── Human-readable report ───────────────────────────────────────────────────

export function printAnalyzeReport(
  analyzeRootDirectoryPath: string,
  analyzeReport: AnalyzeReport,
  logger: CliLogger,
): void {
  logger.out(`Path: ${path.resolve(analyzeRootDirectoryPath)}`);
  logger.out(`.ts/.tsx files: ${analyzeReport.files}`);
  logger.out(`cn(...) call sites: ${analyzeReport.cnCallExpressions}`);
  logger.out(`tv(...) call sites: ${analyzeReport.tvCallExpressions}`);
  logger.out(
    `\nLong cn(...) string literals (≥${LONG_STRING_TOKEN_THRESHOLD} tokens — consider splitting arguments): ${analyzeReport.longCnStringLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longCnStringLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${analyzeReport.longCnStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\nLong tv({...}) string literals in base/variants/… (≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longTvStringLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longTvStringLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${analyzeReport.longTvStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\nJSX className="..." or className={'...'} (static strings, ≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longJsxClassNameLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${analyzeReport.longJsxClassNameLiterals.length - MAX_REPORT_LINES} more`);
  }
  logger.out(
    `\ncn(...) nested inside tv({...}) (prefer a string or array — preview/apply can rewrite): ${analyzeReport.cnInsideTvCalls.length}`,
  );
  for (const findingEntry of analyzeReport.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    logger.out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.argCount} args)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    logger.out(`  … and ${analyzeReport.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
  }
}

// ─── Injectable presenter class ───────────────────────────────────────────────

@injectable([inject(CliLoggerToken)])
export class PresentAnalyzeReportPresenterImpl implements PresentAnalyzeReportPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(resolvedTargetPath: string, report: AnalyzeReport): void {
    printAnalyzeReport(resolvedTargetPath, report, this.logger);
  }
}

// ─── JSON output ─────────────────────────────────────────────────────────────

export type ArrangeAnalyzeJsonPayloadV1 = {
  readonly schemaVersion: 1;
  readonly analyzeRootPath: string;
  readonly report: AnalyzeReport;
};

export function formatArrangeAnalyzeJsonOutput(
  analyzeRootPath: string,
  report: AnalyzeReport,
): string {
  const payload: ArrangeAnalyzeJsonPayloadV1 = { schemaVersion: 1, analyzeRootPath, report };
  return JSON.stringify(payload);
}
