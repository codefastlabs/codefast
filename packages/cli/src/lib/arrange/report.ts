import path from "node:path";
import { LONG_STRING_TOKEN_THRESHOLD, MAX_REPORT_LINES } from "#lib/arrange/constants";
import type { CliLogger } from "#lib/infra/fs-contract";
import type { AnalyzeReport } from "#lib/arrange/types";

export function printAnalyzeReport(dir: string, r: AnalyzeReport, logger: CliLogger): void {
  const { out } = logger;
  out(`Path: ${path.resolve(dir)}`);
  out(`.ts/.tsx files: ${r.files}`);
  out(`cn(...) call sites: ${r.cnCallExpressions}`);
  out(`tv(...) call sites: ${r.tvCallExpressions}`);
  out(
    `\nLong cn(...) string literals (≥${LONG_STRING_TOKEN_THRESHOLD} tokens — consider splitting arguments): ${r.longCnStringLiterals.length}`,
  );
  for (const x of r.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} tokens)  ${x.preview}`);
  }
  if (r.longCnStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${r.longCnStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\nLong tv({...}) string literals in base/variants/… (≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${r.longTvStringLiterals.length}`,
  );
  for (const x of r.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} tokens)  ${x.preview}`);
  }
  if (r.longTvStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${r.longTvStringLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\nJSX className="..." or className={'...'} (static strings, ≥${LONG_STRING_TOKEN_THRESHOLD} tokens): ${r.longJsxClassNameLiterals.length}`,
  );
  for (const x of r.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} tokens)  ${x.preview}`);
  }
  if (r.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    out(`  … and ${r.longJsxClassNameLiterals.length - MAX_REPORT_LINES} more`);
  }
  out(
    `\ncn(...) nested inside tv({...}) (prefer a string or array — preview/apply can rewrite): ${r.cnInsideTvCalls.length}`,
  );
  for (const x of r.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.argCount} args)  ${x.preview}`);
  }
  if (r.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    out(`  … and ${r.cnInsideTvCalls.length - MAX_REPORT_LINES} more`);
  }
}
