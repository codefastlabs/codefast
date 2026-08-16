import path from "node:path";

import type { DividerDefectKind } from "#/audit/domain/comment-dividers";
import { applyCommentDividerFixes, DIVIDER_COLUMN, scanCommentDividers } from "#/audit/domain/comment-dividers";
import type { CommentAuditResult, DividerBreakage, DividerFileBreakages } from "#/audit/domain/types";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { sourceCommentLanguage, walkSourceFiles } from "#/core/workspace/source-walk";

const reasonByDefect: Record<DividerDefectKind, string> = {
  "bad-width": `rule does not end at column ${DIVIDER_COLUMN}`,
  "legacy-form": "legacy divider form",
};

/**
 * Report — and with `fix`, rewrite — every section divider that is not in the repo's one allowed form.
 */
export function runCommentAudit(
  fs: FilesystemPort,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
    readonly fix: boolean;
  },
): Result<CommentAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath, fix } = args;
    const filesToScan = collectScanPaths(fs, targetPath);
    const files: Array<DividerFileBreakages> = [];
    let breakageCount = 0;
    let allowlistedCount = 0;
    let fixedCount = 0;
    let dividerCount = 0;

    for (const absolutePath of filesToScan) {
      const language = sourceCommentLanguage(absolutePath);
      if (language === null) {
        continue;
      }
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      const original = fs.readFileSync(absolutePath, "utf8");
      let content = original;

      if (fix) {
        const rewritten = applyCommentDividerFixes(content, language);
        if (rewritten.fixedCount > 0) {
          fs.writeFileSync(absolutePath, rewritten.content, "utf8");
          content = rewritten.content;
          fixedCount += rewritten.fixedCount;
        }
      }

      const regions = scanCommentDividers(content, language);
      dividerCount += regions.length;

      const breakages: Array<DividerBreakage> = [];
      for (const region of regions) {
        if (region.defect === null) {
          continue;
        }
        if (allowlist.has(region.raw) || allowlist.has(`${relativePath}:${region.raw}`)) {
          allowlistedCount++;
          continue;
        }
        breakages.push({ line: region.startLine, raw: region.raw, reason: reasonByDefect[region.defect] });
      }

      if (breakages.length === 0) {
        continue;
      }
      breakageCount += breakages.length;
      files.push({ relativePath, breakages });
    }

    return ok({
      files,
      breakageCount,
      allowlistedCount,
      fixedCount,
      dividerCount,
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
  return walkSourceFiles(targetPath, fs);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
