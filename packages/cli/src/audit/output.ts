import type { AuditAllReport, AuditReport } from "#audit/domain/types";
import { logger } from "#core/logger";
import { presentFindings, presentSummary } from "#core/report";
import { paint } from "#core/style";

function count(amount: number, noun: string): string {
  return `${amount} ${noun}${amount === 1 ? "" : "s"}`;
}

/**
 * Returns the one-line account of an audit report: its findings, what it scanned, and what it accepted or fixed.
 */
export function describeAuditReport(report: AuditReport): string {
  const scanned = [
    report.scannedFiles > 0 || report.scannedPackages === 0 ? count(report.scannedFiles, "file") : "",
    report.scannedPackages > 0 ? count(report.scannedPackages, "package") : "",
  ]
    .filter(Boolean)
    .join(" and ");
  const found = report.findings.length === 0 ? "no findings" : count(report.findings.length, "finding");
  const allowlisted = report.allowlisted > 0 ? `, ${report.allowlisted} allowlisted` : "";
  const fixed = report.fixedFiles.length > 0 ? `, ${count(report.fixedFiles.length, "file")} fixed` : "";
  return `${found} in ${scanned}${allowlisted}${fixed}`;
}

/**
 * Prints one audit's findings, then its summary line.
 */
export function presentAuditReport(name: string, report: AuditReport, elapsedSeconds: number): void {
  presentFindings(report.findings);
  presentSummary(report.findings.length === 0, `audit:${name}: ${describeAuditReport(report)}`, elapsedSeconds);
}

/**
 * Prints every audit of a full run as one line under its name with its findings beneath, then the summary.
 */
export function presentAuditAll(report: AuditAllReport, elapsedSeconds: number): void {
  for (const run of report.audits) {
    const name = `audit:${run.name}`;
    switch (run.status) {
      case "skipped":
        logger.out(paint("dim", `○ ${name}: ${run.reason}`));
        break;
      case "error":
        logger.out(`${paint("red", "✗")} ${name}: [${run.error.code}] ${run.error.message}`);
        break;
      default:
        logger.out(
          `${run.status === "clean" ? paint("green", "✓") : paint("red", "✗")} ${name}: ${describeAuditReport(run.result)}`,
        );
        presentFindings(run.result.findings);
    }
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
