import type { CommandSpec } from "#core/command";
import { packagesVerdict, writtenPackageFiles } from "#core/report";
import type { ExportsReport } from "#exports/domain/types";
import { presentExportsReport } from "#exports/output";
import { runExportsGenerate } from "#exports/run";

/**
 * The `exports:generate` command, which writes each package's `package.json#exports` from its built `dist/`.
 */
export const exportsGenerateCommand: CommandSpec<ExportsReport, "dryRun"> = {
  name: "exports:generate",
  description: "Generate package.json exports from dist/ for the packages the target reaches",
  targetHelp: "A package, or a directory holding packages (default: the project root)",
  flags: { dryRun: "Report what would change without writing package.json" },
  run: runExportsGenerate,
  verdict: (report) => packagesVerdict(report.packages),
  present: presentExportsReport,
  writtenFiles: (report, context) =>
    writtenPackageFiles(report.packages, context.workspace.rootDir, context.flags.dryRun),
};
