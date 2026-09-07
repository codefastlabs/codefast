import path from "node:path";

import { auditDisplayNames } from "#/audit/domain/display-names";
import type { DisplayNameAuditResult, DisplayNameFileViolations } from "#/audit/domain/types";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { walkMarkdownFiles } from "#/core/workspace/markdown-walk";
import { walkTsxFiles } from "#/core/workspace/typescript-walk";

/**
 * Trees the convention does not reach: a test or benchmark token is scoped by its file and never
 * meets another author's, and a changelog quotes names as they were.
 */
const SKIPPED_SEGMENTS: ReadonlySet<string> = new Set(["tests", "benchmarks", ".changeset"]);
const SKIPPED_BASENAMES: ReadonlySet<string> = new Set(["CHANGELOG.md"]);

/**
 * Scans a target path for `token()`, `tag()` and module display names that break the convention.
 */
export function runDisplayNameAudit(
  fs: FilesystemPort,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
): Result<DisplayNameAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const filesToScan = collectScanPaths(fs, rootDir, targetPath);
    const files: Array<DisplayNameFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;

    for (const absolutePath of filesToScan) {
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      const content = fs.readFileSync(absolutePath, "utf8");
      const remaining = auditDisplayNames(content).filter(({ raw }) => {
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

    return ok({ files, violationCount, allowlistedCount, scannedFileCount: filesToScan.length });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function collectScanPaths(fs: FilesystemPort, rootDir: string, targetPath: string): Array<string> {
  const stats = fs.statSync(targetPath);
  const candidates = stats.isFile()
    ? [targetPath]
    : [...walkTsxFiles(targetPath, fs), ...walkMarkdownFiles(targetPath, fs)];
  return candidates.filter((absolutePath) => {
    const relative = path.relative(rootDir, absolutePath).split(path.sep);
    return !relative.some((segment) => SKIPPED_SEGMENTS.has(segment)) && !SKIPPED_BASENAMES.has(relative.at(-1)!);
  });
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
