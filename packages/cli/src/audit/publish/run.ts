import path from "node:path";

import type { LegacySubpathFile, PublishAuditResult, UnshippedTargetViolation } from "#audit/domain/types";
import { scanLegacySubpathImports } from "#audit/publish/domain/legacy-subpath";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { listWorkspacePackageDirectories } from "#core/workspace/resolver";
import { sourceCommentLanguage, walkSourceFiles } from "#core/workspace/source-walk";
import { packageJsonFileName } from "#core/workspace/well-known-files";
import { unshippedPublishTargets } from "#pack-slim/domain/transform";

/**
 * Reports what would break a consumer's install: a `#/`-prefixed import Node's ESM resolver rejects on
 * the floor, and an `exports`/`imports` target the slimmed publish manifest does not ship.
 *
 * @since 0.12.0
 */
export async function runPublishAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
  },
): Promise<Result<PublishAuditResult, AppError>> {
  try {
    const { rootDir, targetPath } = args;

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
      legacyImportFiles.push({ relativePath: toPosixPath(path.relative(rootDir, absolutePath)), imports });
    }

    const layout = await listWorkspacePackageDirectories(rootDir, fs, true);
    const unshipped: Array<UnshippedTargetViolation> = [];
    let packageCount = 0;
    for (const packageDir of layout.packageDirectoryPathsAbsolute) {
      const manifestPath = path.join(packageDir, packageJsonFileName);
      if (!fs.existsSync(manifestPath)) {
        continue;
      }
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
      if (manifest.private === true) {
        continue;
      }
      packageCount++;
      const packageName =
        typeof manifest.name === "string" ? manifest.name : toPosixPath(path.relative(rootDir, packageDir));
      for (const target of unshippedPublishTargets(manifest)) {
        unshipped.push({ packageName, field: target.field, subpath: target.subpath, target: target.target });
      }
    }

    return ok({
      legacyImportFiles,
      unshipped,
      legacyImportCount,
      scannedFileCount: sourceFiles.length,
      packageCount,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
