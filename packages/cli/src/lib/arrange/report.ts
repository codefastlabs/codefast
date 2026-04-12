import path from "node:path";
import { LONG_STRING_TOKEN_THRESHOLD, MAX_REPORT_LINES } from "#lib/arrange/constants";
import type { ArrangeLogger } from "#lib/arrange/fs-contract";
import type { AnalyzeReport } from "#lib/arrange/types";

export function printAnalyzeReport(dir: string, r: AnalyzeReport, logger: ArrangeLogger): void {
  const { out } = logger;
  out(`Đường dẫn: ${path.resolve(dir)}`);
  out(`File .ts/.tsx: ${r.files}`);
  out(`Số lần gọi cn(...): ${r.cnCallExpressions}`);
  out(`Số lần gọi tv(...): ${r.tvCallExpressions}`);
  out(
    `\nChuỗi literal trong cn có ≥${LONG_STRING_TOKEN_THRESHOLD} token (cân nhắc tách đối số): ${r.longCnStringLiterals.length}`,
  );
  for (const x of r.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longCnStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longCnStringLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
  out(
    `\nChuỗi literal trong cấu hình tv (base/variants/…) ≥${LONG_STRING_TOKEN_THRESHOLD} token: ${r.longTvStringLiterals.length}`,
  );
  for (const x of r.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longTvStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longTvStringLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
  out(
    `\nJSX className="..." hoặc className={'...'} (chuỗi tĩnh, ≥${LONG_STRING_TOKEN_THRESHOLD} token): ${r.longJsxClassNameLiterals.length}`,
  );
  for (const x of r.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longJsxClassNameLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
  out(
    `\nGọi cn(...) lồng trong tv({...}) (nên thay bằng chuỗi hoặc mảng — preview/apply): ${r.cnInsideTvCalls.length}`,
  );
  for (const x of r.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.argCount} đối số)  ${x.preview}`);
  }
  if (r.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    out(`  … và ${r.cnInsideTvCalls.length - MAX_REPORT_LINES} vị trí khác`);
  }
}
