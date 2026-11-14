import type { CommandSpec } from "#core/command";
import { writtenPackageFiles } from "#core/report";
import type { SinceStampReport } from "#since/domain/types";
import { presentSinceStampReport, sinceStampVerdict } from "#since/output";
import { runSinceStamp } from "#since/run";

/**
 * The `since:stamp` command, which stamps `@since <version>` on exported declarations that lack one.
 */
export const sinceStampCommand: CommandSpec<SinceStampReport, "dryRun"> = {
  name: "since:stamp",
  description: "Stamp @since <version> TSDoc tags on the exported declarations that lack one",
  targetHelp: "A package, a directory holding packages, or a source file (default: the project root)",
  flags: { dryRun: "Report what would be stamped without writing" },
  run: runSinceStamp,
  verdict: sinceStampVerdict,
  present: presentSinceStampReport,
  writtenFiles: (report, context) =>
    writtenPackageFiles(report.packages, context.workspace.rootDir, context.flags.dryRun),
};
