import { auditDisplayNames } from "#audit/display-names/domain/display-names";
import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkMarkdownFiles } from "#core/workspace/markdown-walk";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Trees the convention does not reach: a test or benchmark token is scoped by its file and never
 * meets another author's, and a changelog quotes names as they were.
 */
const SKIPPED_SEGMENTS: ReadonlySet<string> = new Set(["tests", "benchmarks", ".changeset"]);
const SKIPPED_BASENAMES: ReadonlySet<string> = new Set(["CHANGELOG.md"]);

function isReached(relativePath: string): boolean {
  const segments = relativePath.split("/");
  return !segments.some((segment) => SKIPPED_SEGMENTS.has(segment)) && !SKIPPED_BASENAMES.has(segments.at(-1) ?? "");
}

/**
 * Scans the target, code and markdown alike, for `token()`, `tag()` and module display names that break the convention.
 *
 * @since 0.9.0
 */
export function runDisplayNameAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const files = [...walkTsxFiles(target.path, fs), ...walkMarkdownFiles(target.path, fs)]
      .map((filePath) => ({ filePath, relativePath: relativePosixPath(workspace.rootDir, filePath) }))
      .filter(({ relativePath }) => isReached(relativePath));
    const findings = files.flatMap(({ filePath, relativePath }) =>
      findingsIn(relativePath, auditDisplayNames(fs.readFileSync(filePath, "utf8"))),
    );
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
