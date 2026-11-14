import path from "node:path";

import type { CommentContentDefectKind } from "#audit/comments/domain/comment-content";
import { scanCommentContent } from "#audit/comments/domain/comment-content";
import type { DividerDefectKind } from "#audit/comments/domain/comment-dividers";
import { applyCommentDividerFixes, DIVIDER_COLUMN, scanCommentDividers } from "#audit/comments/domain/comment-dividers";
import type { LinkReference } from "#audit/comments/domain/link-references";
import {
  countHeadMentions,
  isPathLinkTarget,
  linkTargetHead,
  scanLinkReferences,
} from "#audit/comments/domain/link-references";
import { scanImpossibleSinceTags } from "#audit/comments/domain/since-versions";
import { scanTsdocSyntax } from "#audit/comments/domain/tsdoc-syntax";
import { findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan, Detection } from "#audit/domain/types";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { findNearestPackageVersion } from "#core/workspace/package-version";
import { sourceCommentLanguage, walkSourceFiles } from "#core/workspace/source-walk";

const reasonByDefect: Record<CommentContentDefectKind | DividerDefectKind | "dead-link" | "since-impossible", string> =
  {
    "bad-width": `rule does not end at column ${DIVIDER_COLUMN}`,
    "dead-link": "{@link} target has no mention outside links — likely renamed",
    "detached-doc": "// run separates a doc block from its declaration — merge it into the block",
    "doc-pointer": "comment points at a document — state the invariant here instead",
    "jsdoc-type": "JSDoc {type} syntax — the declaration already carries the type",
    "legacy-form": "legacy divider form",
    "param-coverage": "a block naming any parameter must name them all — a partial list reads as complete",
    "param-hyphen": "TSDoc separates the name from its description with ' - '",
    "since-impossible":
      "@since names a version the package has not reached — set it to the release that shipped the symbol",
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
 * Reports every comment off the repo's conventions: divider form (which `--fix` rewrites first), banned
 * content — document pointers, JSDoc types, tag misuse — `{@link}` targets nothing declares, and
 * every diagnostic the official TSDoc parser raises against a doc block's grammar.
 *
 * @since 0.6.0
 */
export function runCommentAudit({ fs, workspace, target, flags }: AuditContext): Result<AuditScan, AppError> {
  try {
    const { rootDir } = workspace;
    const files = walkSourceFiles(target.path, fs);
    const scanned: Array<ScannedFile> = [];
    const findings: Array<Finding> = [];
    const fixedFiles: Array<string> = [];
    const versionByDirectory = new Map<string, string | null>();

    for (const absolutePath of files) {
      const language = sourceCommentLanguage(absolutePath);
      if (language === null) {
        continue;
      }
      const relativePath = relativePosixPath(rootDir, absolutePath);
      let content = fs.readFileSync(absolutePath, "utf8");
      if (flags.fix) {
        const rewritten = applyCommentDividerFixes(content, language);
        if (rewritten.fixedCount > 0) {
          fs.writeFileSync(absolutePath, rewritten.content, "utf8");
          content = rewritten.content;
          fixedFiles.push(relativePath);
        }
      }
      scanned.push({ absolutePath, relativePath, content, links: scanLinkReferences(content) });

      const detections: Array<Detection> = [];
      for (const region of scanCommentDividers(content, language)) {
        if (region.defect !== null) {
          detections.push({ line: region.startLine, raw: region.raw, reason: reasonByDefect[region.defect] });
        }
      }
      // The content rules — banned fragments, `@since`, TSDoc grammar — govern doc comments in
      // code; an ignore file carries only the divider convention.
      if (language !== "ignore") {
        for (const finding of scanCommentContent(content, language)) {
          detections.push({ line: finding.line, raw: finding.raw, reason: reasonByDefect[finding.defect] });
        }
        const packageVersion = nearestVersion(fs, absolutePath, versionByDirectory);
        if (packageVersion !== null) {
          for (const finding of scanImpossibleSinceTags(content, packageVersion)) {
            detections.push({ line: finding.line, raw: finding.raw, reason: reasonByDefect["since-impossible"] });
          }
        }
        if (language === "js") {
          detections.push(...scanTsdocSyntax(content));
        }
      }
      findings.push(...findingsIn(relativePath, detections));
    }

    // Cross-file resolution only sees what was scanned, so a partial scan would misread
    // every out-of-scope symbol as dead — the check runs on full-tree scans alone.
    if (target.path === rootDir) {
      findings.push(...deadLinkFindings(fs, scanned));
    }

    return ok({ findings, scannedFiles: files.length, scannedPackages: 0, fixedFiles });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function deadLinkFindings(fs: Filesystem, scanned: ReadonlyArray<ScannedFile>): Array<Finding> {
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

  const findings: Array<Finding> = [];
  for (const file of scanned) {
    for (const reference of file.links) {
      if (reference.target.startsWith("http://") || reference.target.startsWith("https://")) {
        continue;
      }
      const dead = isPathLinkTarget(reference.target)
        ? !fs.existsSync(path.resolve(path.dirname(file.absolutePath), reference.target))
        : (mentions.get(linkTargetHead(reference.target)) ?? 0) <=
          (linkOccurrences.get(linkTargetHead(reference.target)) ?? 0);
      if (dead) {
        findings.push({
          file: file.relativePath,
          line: reference.line,
          text: `{@link ${reference.target}}`,
          message: reasonByDefect["dead-link"],
        });
      }
    }
  }
  return findings;
}

// One package.json walk per directory — sibling files share the answer.
function nearestVersion(fs: Filesystem, absolutePath: string, cache: Map<string, string | null>): string | null {
  const directory = path.dirname(absolutePath);
  const cached = cache.get(directory);
  if (cached !== undefined) {
    return cached;
  }
  const version = findNearestPackageVersion(fs, directory);
  cache.set(directory, version);
  return version;
}
