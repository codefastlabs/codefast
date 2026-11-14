import type { CommandSpec } from "#core/command";
import { packagesVerdict, writtenPackageFiles } from "#core/report";
import type { PublishPrepareReport } from "#publish/domain/types";
import { presentPublishPrepareReport } from "#publish/output";
import { runPublishPrepare } from "#publish/run";

/**
 * The `publish:prepare` command, which slims published packages down to what a consumer installs, right before
 * publish.
 */
export const publishPrepareCommand: CommandSpec<PublishPrepareReport, "dryRun" | "force"> = {
  name: "publish:prepare",
  description:
    "Prepare published packages for publish: strip src, source conditions, unshipped imports, dev-only scripts, " +
    "devDependencies and dist source maps",
  targetHelp: "A package, or a directory holding packages (default: the project root)",
  flags: {
    dryRun: "Report what would change without touching any file",
    force: "Run even if the git working tree has uncommitted tracked changes",
  },
  run: runPublishPrepare,
  verdict: (report) => packagesVerdict(report.packages),
  present: presentPublishPrepareReport,
  writtenFiles: (report, context) =>
    writtenPackageFiles(report.packages, context.workspace.rootDir, context.flags.dryRun),
};
