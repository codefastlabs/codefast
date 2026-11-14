import path from "node:path";

import type {
  LegacySubpathFile,
  PublishAuditResult,
  UnreachableStylesheetViolation,
  UnshippedTargetViolation,
} from "#audit/domain/types";
import { scanLegacySubpathImports } from "#audit/publish/domain/legacy-subpath";
import { missesShippedFiles, scanStylesheetSources } from "#audit/publish/domain/stylesheet-sources";
import { listShippedFiles } from "#audit/publish/shipped-files";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { sourceCommentLanguage, walkSourceFiles } from "#core/workspace/source-walk";
import type { Workspace } from "#core/workspace/workspace";
import { packagesInTarget } from "#core/workspace/workspace";
import { unshippedPublishTargets } from "#publish/domain/transform";

/**
 * Reports what would break a consumer's install: a `#/`-prefixed import Node's ESM resolver rejects on
 * the floor, an `exports`/`imports` target the slimmed publish manifest does not ship, and a shipped
 * stylesheet whose `@source` paths reach none of the files that do ship.
 *
 * @since 0.12.0
 */
export function runPublishAudit(
  fs: Filesystem,
  args: {
    readonly workspace: Workspace;
    readonly targetPath: string;
  },
): Result<PublishAuditResult, AppError> {
  try {
    const { workspace, targetPath } = args;
    const { rootDir } = workspace;

    const legacyImportFiles: Array<LegacySubpathFile> = [];
    let legacyImportCount = 0;
    // Tests are not published and may hold `#/` fixtures on purpose, so the specifier scan skips them.
    const sourceFiles = walkSourceFiles(targetPath, fs).filter(
      (filePath) => sourceCommentLanguage(filePath) === "js" && !filePath.split(path.sep).includes("tests"),
    );
    for (const absolutePath of sourceFiles) {
      const imports = scanLegacySubpathImports(fs.readFileSync(absolutePath, "utf8"));
      if (imports.length === 0) {
        continue;
      }
      legacyImportCount += imports.length;
      legacyImportFiles.push({ relativePath: relativePosixPath(rootDir, absolutePath), imports });
    }

    const unshipped: Array<UnshippedTargetViolation> = [];
    const unreachableStylesheets: Array<UnreachableStylesheetViolation> = [];
    let packageCount = 0;
    for (const workspacePackage of packagesInTarget(workspace, targetPath)) {
      if (workspacePackage.isPrivate) {
        continue;
      }
      packageCount++;
      const { name: packageName, directory: packageDir, manifest } = workspacePackage;
      for (const target of unshippedPublishTargets(manifest)) {
        unshipped.push({ packageName, field: target.field, subpath: target.subpath, target: target.target });
      }
      for (const violation of unreachableStylesheetsOf(fs, { rootDir, packageDir, manifest })) {
        unreachableStylesheets.push({ packageName, ...violation });
      }
    }

    return ok({
      legacyImportFiles,
      unshipped,
      unreachableStylesheets,
      legacyImportCount,
      scannedFileCount: sourceFiles.length,
      packageCount,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

// The shipped stylesheets whose `@source` paths register nothing the tarball ships — what a consumer's Tailwind scans.
function unreachableStylesheetsOf(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly packageDir: string;
    readonly manifest: Readonly<Record<string, unknown>>;
  },
): Array<Omit<UnreachableStylesheetViolation, "packageName">> {
  const { rootDir, packageDir, manifest } = args;
  const shipped = listShippedFiles(fs, packageDir, manifest);
  if (shipped === null) {
    return [];
  }
  const violations: Array<Omit<UnreachableStylesheetViolation, "packageName">> = [];
  for (const stylesheet of shipped.files.filter((file) => file.endsWith(".css"))) {
    const stylesheetPath = path.join(packageDir, stylesheet);
    const sources = scanStylesheetSources(fs.readFileSync(stylesheetPath, "utf8"));
    if (sources.length > 0 && missesShippedFiles(stylesheet, sources, shipped.files)) {
      violations.push({
        stylesheet: relativePosixPath(rootDir, stylesheetPath),
        sources,
        missingFilesEntries: shipped.missingEntries,
      });
    }
  }
  return violations;
}
