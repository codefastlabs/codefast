import type { ReportContext } from "#core/command";
import { countPackageOutcomes, packagesVerdict, presentPackageOutcomes, presentSummary } from "#core/report";
import type { ExportsFlag, ExportsPackageOutcome, ExportsReport } from "#exports/domain/types";

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

// What the summary adds after the counts: why nothing was written, and under `--check` what to run on a failure.
function modeNote(report: ExportsReport, flags: Readonly<Record<ExportsFlag, boolean>>): string {
  if (flags.check) {
    return report.packages.some((outcome) => outcome.status === "changed")
      ? " — stale; run exports:generate to write them"
      : " — check, nothing written";
  }
  return flags.dryRun ? " — dry run, nothing written" : "";
}

/**
 * Prints an `exports:generate` report: one row per package, then the summary.
 */
export function presentExportsReport(report: ExportsReport, context: ReportContext<ExportsFlag>): void {
  presentPackageOutcomes(report.packages, describeExports);
  presentSummary(
    packagesVerdict(report.packages, context.flags.check) === "pass",
    `exports:generate: ${countPackageOutcomes(report.packages)}${modeNote(report, context.flags)}`,
    context.elapsedSeconds,
  );
}
