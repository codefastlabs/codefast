import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { defaultImportPolicyRules } from "#audit/imports/domain/import-policy";
import { auditImportPolicySource } from "#audit/imports/domain/import-policy";
import { AppError, messageFrom } from "#core/errors";
import { createAnyGlobMatcher } from "#core/glob";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans the target for banned import forms, applying each rule only to the files in its scope.
 *
 * @since 0.10.0
 */
export function runImportsAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const scopedRules = defaultImportPolicyRules.map((rule) => ({
      rule,
      isInScope: rule.scope ? createAnyGlobMatcher(rule.scope, { dot: true }) : () => true,
    }));
    const files = walkTsxFiles(target.path, fs);
    const findings = files.flatMap((filePath) => {
      const relativePath = relativePosixPath(workspace.rootDir, filePath);
      const rules = scopedRules.filter(({ isInScope }) => isInScope(relativePath)).map(({ rule }) => rule);
      return rules.length === 0
        ? []
        : findingsIn(relativePath, auditImportPolicySource(filePath, fs.readFileSync(filePath, "utf8"), rules));
    });
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
