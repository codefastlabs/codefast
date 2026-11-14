import { auditDisplayNames } from "#audit/di-display-names/domain/display-names";
import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkMarkdownFiles } from "#core/workspace/markdown-walk";
import { walkTsxFiles } from "#core/workspace/typescript-walk";
import type { Workspace } from "#core/workspace/workspace";
import { owningPackage } from "#core/workspace/workspace";

/**
 * Trees the convention does not reach: a test or benchmark token is scoped by its file and never
 * meets another author's, and a changelog quotes names as they were.
 */
const SKIPPED_SEGMENTS: ReadonlySet<string> = new Set(["tests", "benchmarks", ".changeset"]);
const SKIPPED_BASENAMES: ReadonlySet<string> = new Set(["CHANGELOG.md"]);

/** The package whose display names the convention governs. */
const DI_PACKAGE = "@codefast/di";

/** A quoted `@codefast/di` module specifier, its subpaths included and `@codefast/di-testing` left out. */
const DI_SPECIFIER = /["']@codefast\/di(?:\/[^"']*)?["']/;

/** A mention of `@codefast/di` in prose, `@codefast/di-testing` left out. */
const DI_MENTION = /@codefast\/di(?![\w-])/;

// A file uses `@codefast/di` when the package holds it, when its code imports the package, or when its prose names it.
function usesDi(workspace: Workspace, filePath: string, content: string): boolean {
  if (owningPackage(workspace, filePath)?.name === DI_PACKAGE) {
    return true;
  }
  return filePath.endsWith(".md") ? DI_MENTION.test(content) : DI_SPECIFIER.test(content);
}

function isReached(relativePath: string): boolean {
  const segments = relativePath.split("/");
  return !segments.some((segment) => SKIPPED_SEGMENTS.has(segment)) && !SKIPPED_BASENAMES.has(segments.at(-1) ?? "");
}

/**
 * Scans the code and markdown under the target that use `@codefast/di` for `token()`, `tag()` and module display
 * names that break the convention.
 *
 * @remarks A file that does not use `@codefast/di` is not read for names, so another library's `token()` is never
 * mistaken for one.
 *
 * @since 0.9.0
 */
export function runDisplayNameAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const files = [...walkTsxFiles(target.path, fs), ...walkMarkdownFiles(target.path, fs)]
      .filter((filePath) => isReached(relativePosixPath(workspace.rootDir, filePath)))
      .map((filePath) => ({ filePath, content: fs.readFileSync(filePath, "utf8") }))
      .filter(({ filePath, content }) => usesDi(workspace, filePath, content));
    const findings = files.flatMap(({ filePath, content }) =>
      findingsIn(relativePosixPath(workspace.rootDir, filePath), auditDisplayNames(content)),
    );
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
