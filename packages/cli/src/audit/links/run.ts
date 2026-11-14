import path from "node:path";

import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan, Detection } from "#audit/domain/types";
import { collectMarkdownAnchors, scanMarkdownLinks } from "#audit/links/domain/markdown-links";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkMarkdownFiles } from "#core/workspace/markdown-walk";

/**
 * Reports markdown links that point at nothing — a missing path, or an anchor the target does not offer.
 *
 * @since 0.5.0
 */
export function runLinkAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  try {
    const files = walkMarkdownFiles(target.path, fs);
    // One read per document however many links land on it.
    const anchorsByFile = new Map<string, ReadonlySet<string>>();
    const findings: Array<Finding> = [];
    for (const absolutePath of files) {
      const scan = scanMarkdownLinks(fs.readFileSync(absolutePath, "utf8"));
      anchorsByFile.set(absolutePath, scan.anchors);
      const detections = scan.references
        .map((reference) => inspectReference(fs, anchorsByFile, { absolutePath, reference, ownAnchors: scan.anchors }))
        .filter((detection) => detection !== null);
      findings.push(...findingsIn(relativePosixPath(workspace.rootDir, absolutePath), detections));
    }
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function inspectReference(
  fs: Filesystem,
  anchorsByFile: Map<string, ReadonlySet<string>>,
  args: {
    readonly absolutePath: string;
    readonly reference: { line: number; targetPath: string; anchor: string | null };
    readonly ownAnchors: ReadonlySet<string>;
  },
): Detection | null {
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
