import path from "node:path";
import { inject, injectable } from "@codefast/di";
import {
  LONG_STRING_TOKEN_THRESHOLD,
  MAX_REPORT_LINES,
} from "#/domains/arrange/domain/constants.domain";
import type { AnalyzeReport } from "#/domains/arrange/domain/types.domain";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/contracts/analyze-report-presenter.contract";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliLoggerToken)])
export class PresentAnalyzeReportPresenterImpl implements PresentAnalyzeReportPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(resolvedTargetPath: string, report: AnalyzeReport): void {
    this.printAnalyzeReport(resolvedTargetPath, report);
  }

  private printAnalyzeReport(analyzeRootDirectoryPath: string, analyzeReport: AnalyzeReport): void {
    this.logger.out(`Path: ${path.resolve(analyzeRootDirectoryPath)}`);
    this.logger.out(`.ts/.tsx files: ${analyzeReport.files}`);
    this.logger.out(`cn(...) call sites: ${analyzeReport.cnCallExpressions}`);
    this.logger.out(`tv(...) call sites: ${analyzeReport.tvCallExpressions}`);
    this.logger.out(
      `\nLong cn(...) string literals (≥${LONG_STRING_TOKEN_THRESHOLD} tokens — consider splitting arguments): ${analyzeReport.longCnStringLiterals.length}`,
    );
    for (const findingEntry of analyzeReport.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
      this.logger.out(
        `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
      );
    }
    if (analyzeReport.longCnStringLiterals.length > MAX_REPORT_LINES) {
      this.logger.out(
        `  … and ${analyzeReport.longCnStringLiterals.length - MAX_REPORT_LINES} more`,
      );
    }
    this.logger.out(
      `\nLong tv({...}) string literals in base/variants/… (≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longTvStringLiterals.length}`,
    );
    for (const findingEntry of analyzeReport.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
      this.logger.out(
        `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
      );
    }
    if (analyzeReport.longTvStringLiterals.length > MAX_REPORT_LINES) {
      this.logger.out(
        `  … and ${analyzeReport.longTvStringLiterals.length - MAX_REPORT_LINES} more`,
      );
    }
    this.logger.out(
      `\nJSX className="..." or className={'...'} (static strings, ≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longJsxClassNameLiterals.length}`,
    );
    for (const findingEntry of analyzeReport.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
      this.logger.out(
        `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
      );
    }
    if (analyzeReport.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
      this.logger.out(
        `  … and ${analyzeReport.longJsxClassNameLiterals.length - MAX_REPORT_LINES} more`,
      );
    }
    this.logger.out(
      `\ncn(...) nested inside tv({...}) (prefer a string or array — preview/apply can rewrite): ${analyzeReport.cnInsideTvCalls.length}`,
    );
    for (const findingEntry of analyzeReport.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
      this.logger.out(
        `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.argCount} args)  ${findingEntry.preview}`,
      );
    }
    if (analyzeReport.cnInsideTvCalls.length > MAX_REPORT_LINES) {
      this.logger.out(`  … and ${analyzeReport.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
    }
  }
}
