import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { auditImportPolicySource } from "#audit/imports/domain/import-policy";
import { AppError, messageFrom } from "#core/errors";
import { createAnyGlobMatcher } from "#core/glob";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans the target for the import forms the config's rules ban, each rule only in the files its scope reaches.
 *
 * @remarks The audit holds no rules of its own: a project declares its import policy under `audit.imports.rules`.
 *
 * @since 0.10.0
 */
export function runImportsAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  const section = workspace.config.audit?.imports;
  const rules = (section === false ? undefined : section?.rules) ?? [];
  if (rules.length === 0) {
    return ok(fileScan([], 0));
  }
  try {
    const scopedRules = rules.map((rule) => ({
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
