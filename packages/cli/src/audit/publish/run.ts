import path from "node:path";

import { findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { scanLegacySubpathImports } from "#audit/publish/domain/legacy-subpath";
import { missesShippedFiles, scanStylesheetSources } from "#audit/publish/domain/stylesheet-sources";
import { listShippedFiles } from "#audit/publish/shipped-files";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { lineOfText } from "#core/source-position";
import { sourceCommentLanguage, walkSourceFiles } from "#core/workspace/source-walk";
import { packageJsonFileName } from "#core/workspace/well-known-files";
import type { WorkspacePackage } from "#core/workspace/workspace";
import { packagesInTarget } from "#core/workspace/workspace";
import { unshippedPublishTargets } from "#publish/domain/transform";

/**
 * Reports what would break a consumer's install: a `#/`-prefixed import Node's ESM resolver rejects on
 * the floor, an `exports`/`imports` target the slimmed publish manifest does not ship, and a shipped
 * stylesheet whose `@source` paths reach none of the files that do ship.
 *
 * @since 0.12.0
 */
export function runPublishAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const { rootDir } = workspace;
    const findings: Array<Finding> = [];

    // Tests are not published and may hold `#/` fixtures on purpose, so the specifier scan skips them.
    const sourceFiles = walkSourceFiles(target.path, fs).filter(
      (filePath) => sourceCommentLanguage(filePath) === "js" && !filePath.split(path.sep).includes("tests"),
    );
    for (const filePath of sourceFiles) {
      findings.push(
        ...findingsIn(
          relativePosixPath(rootDir, filePath),
          scanLegacySubpathImports(fs.readFileSync(filePath, "utf8")),
        ),
      );
    }

    const published = packagesInTarget(workspace, target.path).filter((candidate) => !candidate.isPrivate);
    for (const workspacePackage of published) {
      const manifestPath = path.join(workspacePackage.directory, packageJsonFileName);
      const manifestText = fs.readFileSync(manifestPath, "utf8");
      for (const unshipped of unshippedPublishTargets(workspacePackage.manifest)) {
        findings.push({
          file: relativePosixPath(rootDir, manifestPath),
          line: lineOfText(manifestText, JSON.stringify(unshipped.subpath)),
          text: `${unshipped.field}["${unshipped.subpath}"]`,
          message: `${unshipped.target} is not shipped by "files"`,
        });
      }
      findings.push(...unreachableStylesheetsOf(fs, rootDir, workspacePackage));
    }

    return ok({ findings, scannedFiles: sourceFiles.length, scannedPackages: published.length, fixedFiles: [] });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

// The shipped stylesheets whose `@source` paths register nothing the tarball ships — what a consumer's Tailwind scans.
function unreachableStylesheetsOf(fs: Filesystem, rootDir: string, workspacePackage: WorkspacePackage): Array<Finding> {
  const shipped = listShippedFiles(fs, workspacePackage.directory, workspacePackage.manifest);
  if (shipped === null) {
    return [];
  }
  const unbuilt =
    shipped.missingEntries.length > 0
      ? `; ${shipped.missingEntries.join(", ")} not on disk — build the package first`
      : "";
  const findings: Array<Finding> = [];
  for (const stylesheet of shipped.files.filter((file) => file.endsWith(".css"))) {
    const stylesheetPath = path.join(workspacePackage.directory, stylesheet);
    const sources = scanStylesheetSources(fs.readFileSync(stylesheetPath, "utf8"));
    const [first] = sources;
    if (first !== undefined && missesShippedFiles(stylesheet, sources, shipped.files)) {
      findings.push({
        file: relativePosixPath(rootDir, stylesheetPath),
        line: first.line,
        text: sources.map(({ pattern }) => `@source "${pattern}"`).join(" "),
        message: `registers no file the tarball ships${unbuilt}`,
      });
    }
  }
  return findings;
}
