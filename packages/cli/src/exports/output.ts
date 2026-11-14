import type { ReportContext } from "#core/command";
import { countPackageOutcomes, packagesVerdict, presentPackageOutcomes, presentSummary } from "#core/report";
import type { ExportsPackageOutcome, ExportsReport } from "#exports/domain/types";

function describeExports({ exports, pruned }: ExportsPackageOutcome): string {
  const parts = [
    exports.modules > 0 ? `${exports.modules} modules` : "",
    exports.stylesheets > 0 ? `${exports.stylesheets} stylesheets` : "",
    exports.custom > 0 ? `${exports.custom} custom` : "",
  ].filter(Boolean);
  const breakdown = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  const prunedSuffix = pruned.length > 0 ? `; pruned ${pruned.join(", ")}` : "";
  return `${exports.total} exports${breakdown}${prunedSuffix}`;
}

/**
 * Prints an `exports:generate` report: one row per package, then the summary.
 */
export function presentExportsReport(report: ExportsReport, context: ReportContext<"dryRun">): void {
  presentPackageOutcomes(report.packages, describeExports);
  const dryRun = context.flags.dryRun ? " — dry run, nothing written" : "";
  presentSummary(
    packagesVerdict(report.packages) === "pass",
    `exports:generate: ${countPackageOutcomes(report.packages)}${dryRun}`,
    context.elapsedSeconds,
  );
}
