import { auditDoubleAssertionSource } from "#audit/assertions/domain/double-assertion";
import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans the target for double assertions through `unknown` or `any`, tests included.
 *
 * @since 0.13.0
 */
export function runAssertionAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const files = walkTsxFiles(target.path, fs);
    const findings = files.flatMap((filePath) =>
      findingsIn(
        relativePosixPath(workspace.rootDir, filePath),
        auditDoubleAssertionSource(filePath, fs.readFileSync(filePath, "utf8")),
      ),
    );
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
