import { findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { scanImpossibleSinceTags } from "#audit/since-versions/domain/since-tags";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { sourceCommentLanguage } from "#core/workspace/source-walk";
import { walkFiles } from "#core/workspace/walk-files";
import { owningPackage } from "#core/workspace/workspace";

// The files whose comments a `@since` tag can sit in: code and stylesheets, never an ignore file.
function holdsDocComments(filePath: string): boolean {
  const language = sourceCommentLanguage(filePath);
  return language === "js" || language === "css";
}

/**
 * Scans the target's comments for `@since` tags their package cannot have stamped, each judged against the version
 * its own manifest declares.
 *
 * @since 0.16.0
 */
export function runSinceVersionsAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const findings: Array<Finding> = [];
    const judged = new Set<string>();
    let scannedFiles = 0;
    for (const filePath of walkFiles(target.path, fs, holdsDocComments)) {
      const owner = owningPackage(workspace, filePath);
      const version = owner?.manifest.version;
      // A file outside every package, or in one that declares no version, has no release to judge against.
      if (owner === undefined || typeof version !== "string") {
        continue;
      }
      scannedFiles += 1;
      judged.add(owner.directory);
      const detections = scanImpossibleSinceTags(fs.readFileSync(filePath, "utf8"), { name: owner.name, version });
      findings.push(...findingsIn(relativePosixPath(workspace.rootDir, filePath), detections));
    }
    return ok({ findings, scannedFiles, scannedPackages: judged.size, fixedFiles: [] });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
