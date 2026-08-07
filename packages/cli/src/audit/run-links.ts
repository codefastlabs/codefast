import path from "node:path";

import { collectMarkdownAnchors, scanMarkdownLinks } from "#/audit/domain/markdown-links";
import type { LinkAuditResult, LinkFileBreakages, LinkBreakage } from "#/audit/domain/types";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { walkMarkdownFiles } from "#/core/workspace/markdown-walk";

/**
 * Report markdown links that point at nothing — a missing path, or an anchor the target does not offer.
 *
 * @since 0.5.0
 */
export function runLinkAudit(
  fs: FilesystemPort,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
): Result<LinkAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const filesToScan = collectScanPaths(fs, targetPath);
    // One read per document however many links land on it.
    const anchorsByFile = new Map<string, ReadonlySet<string>>();
    const files: Array<LinkFileBreakages> = [];
    let breakageCount = 0;
    let allowlistedCount = 0;
    let linkCount = 0;

    for (const absolutePath of filesToScan) {
      const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
      const content = fs.readFileSync(absolutePath, "utf8");
      const scan = scanMarkdownLinks(content);
      anchorsByFile.set(absolutePath, scan.anchors);
      linkCount += scan.references.length;

      const breakages: Array<LinkBreakage> = [];
      for (const reference of scan.references) {
        const breakage = inspectReference(fs, anchorsByFile, {
          absolutePath,
          reference,
          ownAnchors: scan.anchors,
        });
        if (breakage === null) {
          continue;
        }
        if (allowlist.has(breakage.raw) || allowlist.has(`${relativePath}:${breakage.raw}`)) {
          allowlistedCount++;
          continue;
        }
        breakages.push(breakage);
      }

      if (breakages.length === 0) {
        continue;
      }
      breakageCount += breakages.length;
      files.push({ relativePath, breakages });
    }

    return ok({ files, breakageCount, allowlistedCount, linkCount, scannedFileCount: filesToScan.length });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function inspectReference(
  fs: FilesystemPort,
  anchorsByFile: Map<string, ReadonlySet<string>>,
  args: {
    readonly absolutePath: string;
    readonly reference: { line: number; targetPath: string; anchor: string | null };
    readonly ownAnchors: ReadonlySet<string>;
  },
): LinkBreakage | null {
  const { absolutePath, reference, ownAnchors } = args;
  const raw = reference.anchor === null ? reference.targetPath : `${reference.targetPath}#${reference.anchor}`;

  if (reference.targetPath === "") {
    return ownAnchors.has(reference.anchor!)
      ? null
      : { line: reference.line, raw, reason: "anchor not found in this document" };
  }

  const resolved = path.resolve(path.dirname(absolutePath), reference.targetPath);
  if (!fs.existsSync(resolved)) {
    return { line: reference.line, raw, reason: "path does not exist" };
  }
  if (reference.anchor === null || !resolved.endsWith(".md")) {
    return null;
  }

  // A cross-document anchor fails softly in a browser — it scrolls to the top — so nothing else catches it.
  const anchors =
    anchorsByFile.get(resolved) ??
    (() => {
      const parsed = collectMarkdownAnchors(fs.readFileSync(resolved, "utf8"));
      anchorsByFile.set(resolved, parsed);
      return parsed;
    })();

  return anchors.has(reference.anchor)
    ? null
    : { line: reference.line, raw, reason: `anchor not found in ${path.basename(resolved)}` };
}

function collectScanPaths(fs: FilesystemPort, targetPath: string): Array<string> {
  const stats = fs.statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }
  return walkMarkdownFiles(targetPath, fs);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
