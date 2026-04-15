import path from "node:path";
import {
  LONG_STRING_TOKEN_THRESHOLD,
  MAX_REPORT_LINES,
} from "#lib/arrange/domain/constants.domain";
import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import type { AnalyzeReport } from "#lib/arrange/domain/types.domain";

export function printAnalyzeReport(
  analyzeRootDirectoryPath: string,
  analyzeReport: AnalyzeReport,
  logger: CliLogger,
): void {
  const { out } = logger;
  out(`Path: ${path.resolve(analyzeRootDirectoryPath)}`);
  out(`.ts/.tsx files: ${analyzeReport.files}`);
  out(`cn(...) call sites: ${analyzeReport.cnCallExpressions}`);
  out(`tv(...) call sites: ${analyzeReport.tvCallExpressions}`);
  out(
    `\nLong cn(...) string literals (≥${LONG_STRING_TOKEN_THRESHOLD} tokens — consider splitting arguments): ${analyzeReport.longCnStringLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longCnStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${analyzeReport.longCnStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\nLong tv({...}) string literals in base/variants/… (≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longTvStringLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longTvStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${analyzeReport.longTvStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\nJSX className="..." or className={'...'} (static strings, ≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${analyzeReport.longJsxClassNameLiterals.length}`,
  );
  for (const findingEntry of analyzeReport.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.tokenCount} tokens)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${analyzeReport.longJsxClassNameLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\ncn(...) nested inside tv({...}) (prefer a string or array — preview/apply can rewrite): ${analyzeReport.cnInsideTvCalls.length}`,
  );
  for (const findingEntry of analyzeReport.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    out(
      `  ${findingEntry.file}:${findingEntry.line}  (${findingEntry.argCount} args)  ${findingEntry.preview}`,
    );
  }
  if (analyzeReport.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    out(`  … and ${analyzeReport.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
  }
}
