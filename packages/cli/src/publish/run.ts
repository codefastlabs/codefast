import path from "node:path";

import type { CommandContext } from "#core/command";
import type { AppError } from "#core/errors";
import { messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { ok } from "#core/result";
import { distDirName, packageJsonFileName } from "#core/workspace/well-known-files";
import type { WorkspacePackage } from "#core/workspace/workspace";
import { packagesInTarget } from "#core/workspace/workspace";
import {
  isMapAnnotatedFile,
  isSourceMapFile,
  slimPublishManifest,
  stripSourceMappingComment,
} from "#publish/domain/transform";
import type { PublishPackageOutcome, PublishPrepareReport } from "#publish/domain/types";
import { ensureWorkingTreeClean } from "#publish/working-tree";

const nothingDropped: PublishPackageOutcome["dropped"] = {
  filesSrc: false,
  exportsSource: 0,
  importsSource: 0,
  importsUnshipped: 0,
  scripts: 0,
  devDependencies: 0,
  sourceMaps: 0,
  sourceMappingComments: 0,
};

// Drops the `dist` source maps and the `sourceMappingURL` directives left dangling, returning the files rewritten.
async function pruneDist(
  fs: Filesystem,
  distDir: string,
  write: boolean,
): Promise<{ sourceMaps: number; rewritten: Array<string> }> {
  const rewritten: Array<string> = [];
  let sourceMaps = 0;
  if (!fs.existsSync(distDir)) {
    return { sourceMaps, rewritten };
  }
  for (const entry of await fs.readdirEntries(distDir, { recursive: true })) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.join(entry.parentPath, entry.name);
    if (isSourceMapFile(entry.name)) {
      sourceMaps += 1;
      if (write) {
        await fs.unlink(filePath);
      }
    } else if (isMapAnnotatedFile(entry.name)) {
      const { text, stripped } = stripSourceMappingComment(await fs.readFile(filePath, "utf8"));
      if (stripped) {
        rewritten.push(filePath);
        if (write) {
          await fs.writeFile(filePath, text, "utf8");
        }
      }
    }
  }
  return { sourceMaps, rewritten };
}

async function preparePackage(
  fs: Filesystem,
  rootDir: string,
  workspacePackage: WorkspacePackage,
  write: boolean,
): Promise<PublishPackageOutcome> {
  const base = {
    name: workspacePackage.name,
    directory: workspacePackage.relativeDirectory,
    reason: null,
    files: [],
    dropped: nothingDropped,
  };
  if (workspacePackage.isPrivate) {
    return { ...base, status: "skipped", reason: "private, never published" };
  }
  try {
    const { manifest, report } = slimPublishManifest(workspacePackage.manifest);
    const manifestPath = path.join(workspacePackage.directory, packageJsonFileName);
    if (report.changed && write) {
      await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    }
    const dist = await pruneDist(fs, path.join(workspacePackage.directory, distDirName), write);
    const written = [...(report.changed ? [manifestPath] : []), ...dist.rewritten];
    const changed = written.length > 0 || dist.sourceMaps > 0;
    return {
      ...base,
      status: changed ? "changed" : "unchanged",
      files: written.map((filePath) => relativePosixPath(rootDir, filePath)),
      dropped: {
        filesSrc: report.filesSrcRemoved,
        exportsSource: report.exportsSourceRemoved,
        importsSource: report.importsSourceRemoved,
        importsUnshipped: report.importsUnshippedRemoved,
        scripts: report.scriptsRemoved,
        devDependencies: report.devDependenciesRemoved,
        sourceMaps: dist.sourceMaps,
        sourceMappingComments: dist.rewritten.length,
      },
    };
  } catch (caughtError: unknown) {
    return { ...base, status: "failed", reason: messageFrom(caughtError) };
  }
}

/**
 * Slims every published package the target reaches down to what a consumer installs.
 *
 * @remarks Meant for an ephemeral CI checkout right before `changeset publish`; it refuses to write over uncommitted
 * tracked changes unless `--force` says so, and a dry run writes nothing.
 */
export async function runPublishPrepare(
  context: CommandContext<"dryRun" | "force">,
): Promise<Result<PublishPrepareReport, AppError>> {
  const { fs, workspace, target, flags } = context;
  if (!flags.dryRun && !flags.force) {
    const clean = ensureWorkingTreeClean(workspace.rootDir);
    if (!clean.ok) {
      return clean;
    }
  }
  const packages: Array<PublishPackageOutcome> = [];
  for (const workspacePackage of packagesInTarget(workspace, target.path)) {
    packages.push(await preparePackage(fs, workspace.rootDir, workspacePackage, !flags.dryRun));
  }
  return ok({ packages });
}
