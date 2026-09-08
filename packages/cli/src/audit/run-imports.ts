import path from "node:path";

import { defaultImportPolicyRules } from "#/audit/domain/import-policy";
import { auditImportPolicySource } from "#/audit/domain/import-policy";
import type { ImportPolicyFileViolations, ImportsAuditResult } from "#/audit/domain/types";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import { createAnyGlobMatcher } from "#/core/glob";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { walkTsxFiles } from "#/core/workspace/typescript-walk";

/**
 * Scans a target path for import-policy violations, applying each rule only to files in its scope.
 */
export function runImportsAudit(
  fs: FilesystemPort,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
): Result<ImportsAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const scopedRules = defaultImportPolicyRules.map((rule) => ({
      rule,
      isInScope: rule.scope ? createAnyGlobMatcher(rule.scope, { dot: true }) : () => true,
    }));
    const filesToScan = collectScanPaths(fs, targetPath);
    const files: Array<ImportPolicyFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;

    for (const absolutePath of filesToScan) {
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      const applicableRules = scopedRules.filter(({ isInScope }) => isInScope(relativePath)).map(({ rule }) => rule);
      if (applicableRules.length === 0) {
        continue;
      }
      const content = fs.readFileSync(absolutePath, "utf8");
      const remaining = auditImportPolicySource(absolutePath, content, applicableRules).filter(({ raw }) => {
        const isAllowed = allowlist.has(raw) || allowlist.has(`${relativePath}:${raw}`);
        if (isAllowed) {
          allowlistedCount++;
        }
        return !isAllowed;
      });
      if (remaining.length === 0) {
        continue;
      }
      violationCount += remaining.length;
      files.push({ relativePath, violations: remaining });
    }

    return ok({
      files,
      violationCount,
      allowlistedCount,
      scannedFileCount: filesToScan.length,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function collectScanPaths(fs: FilesystemPort, targetPath: string): Array<string> {
  const stats = fs.statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }
  return walkTsxFiles(targetPath, fs);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
