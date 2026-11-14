import type { AuditAllReport } from "#audit/domain/types";
import { logger } from "#core/logger";
import { presentSummary } from "#core/report";
import { paint } from "#core/style";

/**
 * Prints every audit of a full run under its name, then the summary naming the audits that failed.
 */
export function presentAuditAll(report: AuditAllReport, elapsedSeconds: number): void {
  for (const run of report.audits) {
    logger.out(paint("bold", `audit:${run.name}`));
    if (run.status === "skipped") {
      logger.out(paint("dim", `○ skipped: ${run.reason}`));
    } else {
      run.present();
    }
    logger.out("");
  }
  const failing = report.audits.filter((run) => run.status === "findings" || run.status === "error");
  const ran = report.audits.filter((run) => run.status !== "skipped").length;
  presentSummary(
    failing.length === 0,
    failing.length === 0
      ? `audit: all ${ran} audits that ran are clean`
      : `audit: ${failing.length} of ${report.audits.length} failed — ${failing.map((run) => `${run.name} (${run.status})`).join(", ")}`,
    elapsedSeconds,
  );
}
