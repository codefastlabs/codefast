import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { auditFileContent } from "#audit/rtl/domain/audit-file";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans the target for physical-direction Tailwind classes that should be logical or `rtl:`-paired.
 *
 * @since 0.5.0-canary.6
 */
export function runRtlAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const files = walkTsxFiles(target.path, fs);
    const findings = files.flatMap((filePath) =>
      findingsIn(relativePosixPath(workspace.rootDir, filePath), auditFileContent(fs.readFileSync(filePath, "utf8"))),
    );
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
