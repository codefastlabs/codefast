import type { ReportContext } from "#core/command";
import { countPackageOutcomes, packagesVerdict, presentPackageOutcomes, presentSummary } from "#core/report";
import type { PublishPackageOutcome, PublishPrepareReport } from "#publish/domain/types";

function describeDropped({ status, dropped }: PublishPackageOutcome): string {
  if (status === "unchanged") {
    return "already slim";
  }
  const parts = [
    dropped.filesSrc ? "files:src" : "",
    dropped.exportsSource > 0 ? `exports:source×${dropped.exportsSource}` : "",
    dropped.importsSource > 0 ? `imports:source×${dropped.importsSource}` : "",
    dropped.importsUnshipped > 0 ? `imports:unshipped×${dropped.importsUnshipped}` : "",
    dropped.scripts > 0 ? `scripts×${dropped.scripts}` : "",
    dropped.devDependencies > 0 ? `devDependencies×${dropped.devDependencies}` : "",
    dropped.sourceMaps > 0 ? `source maps×${dropped.sourceMaps}` : "",
    dropped.sourceMappingComments > 0 ? `sourceMappingURL×${dropped.sourceMappingComments}` : "",
  ].filter(Boolean);
  return `dropped ${parts.join(", ")}`;
}

/**
 * Prints a `publish:prepare` report: one row per package, then the summary.
 */
export function presentPublishPrepareReport(
  report: PublishPrepareReport,
  context: ReportContext<"dryRun" | "force">,
): void {
  presentPackageOutcomes(report.packages, describeDropped);
  const dryRun = context.flags.dryRun ? " — dry run, nothing written" : "";
  presentSummary(
    packagesVerdict(report.packages) === "pass",
    `publish:prepare: ${countPackageOutcomes(report.packages)}${dryRun}`,
    context.elapsedSeconds,
  );
}
