import path from "node:path";

import type { CommandContext } from "#core/command";
import { selectPackageConfig } from "#core/config/package-selector";
import type { AppError } from "#core/errors";
import { messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { isWithinDirectory, relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { ok } from "#core/result";
import type { Target } from "#core/target";
import { walkTsxFiles } from "#core/workspace/typescript-walk";
import type { WorkspacePackage } from "#core/workspace/workspace";
import { packagesInTarget } from "#core/workspace/workspace";
import type { SincePackageOutcome, SinceStampReport } from "#since/domain/types";
import { SinceWriter } from "#since/writer/since-writer";

const blockedMessage = "no doc block, and a // comment holds the line above it — write the block by hand, then rerun";

// The package's `src` when it has one, else the package itself.
function sourceRoot(fs: Filesystem, directory: string): string {
  const sourceDirectory = path.join(directory, "src");
  return fs.existsSync(sourceDirectory) && fs.statSync(sourceDirectory).isDirectory() ? sourceDirectory : directory;
}

// The TypeScript files of a package's source the target reaches.
function filesToStamp(fs: Filesystem, root: string, target: Target): Array<string> {
  if (isWithinDirectory(root, target.path)) {
    return walkTsxFiles(target.path, fs);
  }
  return isWithinDirectory(target.path, root) ? walkTsxFiles(root, fs) : [];
}

function stampPackage(
  context: CommandContext<"dryRun">,
  workspacePackage: WorkspacePackage,
  writer: SinceWriter,
  findings: Array<Finding>,
): SincePackageOutcome {
  const { fs, workspace, target, flags } = context;
  const { name, manifest } = workspacePackage;
  const base = {
    name,
    directory: workspacePackage.relativeDirectory,
    reason: null,
    files: [],
    version: null,
    filesScanned: 0,
    stampedDeclarations: 0,
  };
  if (selectPackageConfig(workspace.config.since, name) === false) {
    return { ...base, status: "skipped", reason: "skipped by the config" };
  }
  const version = typeof manifest.version === "string" && manifest.version.length > 0 ? manifest.version : null;
  if (version === null) {
    return { ...base, status: "failed", reason: "package.json declares no version to stamp" };
  }

  try {
    const results = filesToStamp(fs, sourceRoot(fs, workspacePackage.directory), target).map((filePath) =>
      writer.stampFile(filePath, version, !flags.dryRun),
    );
    for (const result of results) {
      for (const blocked of result.blockedDeclarations) {
        findings.push({
          file: relativePosixPath(workspace.rootDir, blocked.filePath),
          line: blocked.line,
          text: blocked.name,
          message: blockedMessage,
        });
      }
    }
    const changed = results.filter((result) => result.changed);
    return {
      ...base,
      status: changed.length > 0 ? "changed" : "unchanged",
      files: changed.map((result) => relativePosixPath(workspace.rootDir, result.filePath)),
      version,
      filesScanned: results.length,
      stampedDeclarations: results.reduce((sum, result) => sum + result.stampedDeclarations, 0),
    };
  } catch (caughtError: unknown) {
    return { ...base, status: "failed", reason: messageFrom(caughtError), version };
  }
}

/**
 * Stamps `@since <version>` on the exported declarations of every package the target reaches.
 *
 * @remarks The version is each package's own; a declaration a `//` comment blocks holds its file back and is reported.
 */
export async function runSinceStamp(context: CommandContext<"dryRun">): Promise<Result<SinceStampReport, AppError>> {
  const writer = new SinceWriter(context.fs);
  const findings: Array<Finding> = [];
  const packages = packagesInTarget(context.workspace, context.target.path).map((workspacePackage) =>
    stampPackage(context, workspacePackage, writer, findings),
  );
  return ok({ packages, findings });
}
