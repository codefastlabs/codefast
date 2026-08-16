import path from "node:path";

import type { CommentContentDefectKind } from "#/audit/domain/comment-content";
import { scanCommentContent } from "#/audit/domain/comment-content";
import type { DividerDefectKind } from "#/audit/domain/comment-dividers";
import { applyCommentDividerFixes, DIVIDER_COLUMN, scanCommentDividers } from "#/audit/domain/comment-dividers";
import type { LinkReference } from "#/audit/domain/link-references";
import {
  countHeadMentions,
  isPathLinkTarget,
  linkTargetHead,
  scanLinkReferences,
} from "#/audit/domain/link-references";
import { scanTsdocSyntax } from "#/audit/domain/tsdoc-syntax";
import type { CommentAuditResult, DividerBreakage, DividerFileBreakages } from "#/audit/domain/types";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { sourceCommentLanguage, walkSourceFiles } from "#/core/workspace/source-walk";

const reasonByDefect: Record<CommentContentDefectKind | DividerDefectKind | "dead-link", string> = {
  "bad-width": `rule does not end at column ${DIVIDER_COLUMN}`,
  "dead-link": "{@link} target has no mention outside links — likely renamed",
  "detached-doc": "// run separates a doc block from its declaration — merge it into the block",
  "doc-pointer": "comment points at a document — state the invariant here instead",
  "jsdoc-type": "JSDoc {type} syntax — the declaration already carries the type",
  "legacy-form": "legacy divider form",
  "param-coverage": "a block naming any parameter must name them all — a partial list reads as complete",
  "param-hyphen": "TSDoc separates the name from its description with ' - '",
  "since-order": "@since is stamped at release and stays the block's last tag",
  "stacked-doc": "// run stacked above a doc block — fold it into the block",
};

interface ScannedFile {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly content: string;
  readonly links: Array<LinkReference>;
}

/**
 * Reports every comment off the repo's conventions: divider form (which `fix` rewrites), banned
 * content — document pointers, JSDoc types, tag misuse — `{@link}` targets nothing declares, and
 * every diagnostic the official TSDoc parser raises against a doc block's grammar.
 *
 * @since 0.6.0
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
    const perFile = new Map<string, Array<DividerBreakage>>();
    const scanned: Array<ScannedFile> = [];
    let allowlistedCount = 0;
    let fixedCount = 0;
    let dividerCount = 0;

    for (const absolutePath of filesToScan) {
      const language = sourceCommentLanguage(absolutePath);
      if (language === null) {
        continue;
      }
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      let content = fs.readFileSync(absolutePath, "utf8");

      if (fix) {
        const rewritten = applyCommentDividerFixes(content, language);
        if (rewritten.fixedCount > 0) {
          fs.writeFileSync(absolutePath, rewritten.content, "utf8");
          content = rewritten.content;
          fixedCount += rewritten.fixedCount;
        }
      }
      scanned.push({ absolutePath, relativePath, content, links: scanLinkReferences(content) });

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
      for (const finding of scanCommentContent(content, language)) {
        if (allowlist.has(finding.raw) || allowlist.has(`${relativePath}:${finding.raw}`)) {
          allowlistedCount++;
          continue;
        }
        breakages.push({ line: finding.line, raw: finding.raw, reason: reasonByDefect[finding.defect] });
      }
      if (language === "js") {
        for (const finding of scanTsdocSyntax(content)) {
          if (allowlist.has(finding.raw) || allowlist.has(`${relativePath}:${finding.raw}`)) {
            allowlistedCount++;
            continue;
          }
          breakages.push({ line: finding.line, raw: finding.raw, reason: finding.reason });
        }
      }
      if (breakages.length > 0) {
        perFile.set(relativePath, breakages);
      }
    }

    // Cross-file resolution only sees what was scanned, so a partial scan would misread
    // every out-of-scope symbol as dead — the check runs on full-tree scans alone.
    if (targetPath === rootDir) {
      allowlistedCount += appendDeadLinkBreakages(fs, scanned, allowlist, perFile);
    }

    const files: Array<DividerFileBreakages> = [];
    let breakageCount = 0;
    for (const [relativePath, breakages] of perFile) {
      breakages.sort((a, b) => a.line - b.line);
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

function appendDeadLinkBreakages(
  fs: FilesystemPort,
  scanned: Array<ScannedFile>,
  allowlist: ReadonlySet<string>,
  perFile: Map<string, Array<DividerBreakage>>,
): number {
  const linkOccurrences = new Map<string, number>();
  const heads = new Set<string>();
  for (const file of scanned) {
    for (const reference of file.links) {
      if (isPathLinkTarget(reference.target)) {
        continue;
      }
      const head = linkTargetHead(reference.target);
      heads.add(head);
      linkOccurrences.set(head, (linkOccurrences.get(head) ?? 0) + 1);
    }
  }
  const mentions = countHeadMentions(
    scanned.map((file) => file.content),
    heads,
  );

  let allowlisted = 0;
  for (const file of scanned) {
    for (const reference of file.links) {
      let dead: boolean;
      if (reference.target.startsWith("http://") || reference.target.startsWith("https://")) {
        continue;
      } else if (isPathLinkTarget(reference.target)) {
        dead = !fs.existsSync(path.resolve(path.dirname(file.absolutePath), reference.target));
      } else {
        const head = linkTargetHead(reference.target);
        dead = (mentions.get(head) ?? 0) <= (linkOccurrences.get(head) ?? 0);
      }
      if (!dead) {
        continue;
      }
      const raw = `{@link ${reference.target}}`;
      if (allowlist.has(raw) || allowlist.has(`${file.relativePath}:${raw}`)) {
        allowlisted++;
        continue;
      }
      const breakages = perFile.get(file.relativePath) ?? [];
      breakages.push({ line: reference.line, raw, reason: reasonByDefect["dead-link"] });
      perFile.set(file.relativePath, breakages);
    }
  }
  return allowlisted;
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
