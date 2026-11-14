import type { ReportContext } from "#core/command";
import { countPackageOutcomes, presentFindings, presentPackageOutcomes, presentSummary } from "#core/report";
import type { SincePackageOutcome, SinceStampReport } from "#since/domain/types";

function describeStamping(outcome: SincePackageOutcome): string {
  const files = `${outcome.filesScanned} files`;
  return outcome.status === "changed"
    ? `@since ${outcome.version} on ${outcome.stampedDeclarations} declarations in ${outcome.files.length} of ${files}`
    : `${files}, nothing to stamp`;
}

/**
 * Prints a `since:stamp` report: one row per package, the declarations left unstamped, then the summary.
 */
export function presentSinceStampReport(report: SinceStampReport, context: ReportContext<"dryRun">): void {
  presentPackageOutcomes(report.packages, describeStamping);
  presentFindings(report.findings);
  const stamped = report.packages.reduce((sum, outcome) => sum + outcome.stampedDeclarations, 0);
  const blocked = report.findings.length > 0 ? `, ${report.findings.length} left unstamped` : "";
  const dryRun = context.flags.dryRun ? " — dry run, nothing written" : "";
  presentSummary(
    sinceStampVerdict(report) === "pass",
    `since:stamp: ${countPackageOutcomes(report.packages)}; ${stamped} declarations stamped${blocked}${dryRun}`,
    context.elapsedSeconds,
  );
}

/**
 * Returns the verdict of a `since:stamp` run: a failed package or an unstamped declaration fails it.
 *
 * @remarks An unstamped declaration fails the run because once its release ships, a later stamp names a version that
 * did not introduce it.
 */
export function sinceStampVerdict(report: SinceStampReport): "pass" | "fail" {
  return report.findings.length > 0 || report.packages.some((outcome) => outcome.status === "failed") ? "fail" : "pass";
}
