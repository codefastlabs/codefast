import path from "node:path";

import { auditDoubleAssertionSource } from "#audit/assertions/domain/double-assertion";
import type { AssertionAuditResult, AssertionFileViolations } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans a target path for double assertions through `unknown` or `any`, tests included.
 *
 * @since 0.13.0
 */
export function runAssertionAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
): Result<AssertionAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const filesToScan = fs.statSync(targetPath).isFile() ? [targetPath] : walkTsxFiles(targetPath, fs);
    const files: Array<AssertionFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;

    for (const absolutePath of filesToScan) {
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join("/");
      const content = fs.readFileSync(absolutePath, "utf8");
      const remaining = auditDoubleAssertionSource(absolutePath, content).filter(({ raw }) => {
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
