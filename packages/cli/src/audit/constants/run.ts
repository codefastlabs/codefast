import path from "node:path";

import { auditNumericConstants } from "#audit/constants/domain/constants";
import type { ConstantAuditResult, ConstantFileViolations } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Trees the convention does not reach: a test fixes a value to observe it, a benchmark sizes a
 * workload, and an app or example is a consumer, not the library.
 */
const SKIPPED_SEGMENTS: ReadonlySet<string> = new Set([
  "tests",
  "benchmarks",
  "apps",
  "examples",
  "node_modules",
  "dist",
]);

/**
 * Scans a target path's library sources for numeric constants that name none of the three kinds.
 *
 * @since 0.11.0
 */
export function runConstantAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
): Result<ConstantAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const filesToScan = collectScanPaths(fs, rootDir, targetPath);
    const files: Array<ConstantFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;
    for (const absolutePath of filesToScan) {
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      const content = fs.readFileSync(absolutePath, "utf8");
      const remaining = auditNumericConstants(content).filter(({ raw }) => {
        const name = raw.split(" ")[0]!;
        const isAllowed = allowlist.has(name) || allowlist.has(`${relativePath}:${name}`);
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
  } catch (error) {
    return err(new AppError("INFRA_FAILURE", messageFrom(error), error));
  }
}

/** The `.ts` files under a `src` directory of a library package, below the target. */
function collectScanPaths(fs: Filesystem, rootDir: string, targetPath: string): Array<string> {
  const candidates = fs.statSync(targetPath).isDirectory() ? walkTsxFiles(targetPath, fs) : [targetPath];
  return candidates.filter((absolutePath) => {
    const segments = toPosixPath(path.relative(rootDir, absolutePath)).split("/");
    return segments.includes("src") && !segments.some((segment) => SKIPPED_SEGMENTS.has(segment));
  });
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
