import { gt, valid } from "semver";

import type { Detection } from "#audit/domain/types";

/**
 * The package a file belongs to, as its manifest names and versions it.
 */
export interface PackageRelease {
  readonly name: string;
  readonly version: string;
}

// `@since` counts only as a comment line's first word, so code and prose that mention it stay out.
const sinceTagPattern = /^\s*(?:\*|\/\/|\/\*+)\s*@since(?![\w-])(.*)$/;

const stampHint = "delete it; since:stamp stamps the release that ships the symbol";

// The version a tag names: its first word, a block's closing `*/` aside.
function stampedVersion(rest: string): string {
  return (
    rest
      .replace(/\*\/.*$/, "")
      .trim()
      .split(/\s+/, 1)[0] ?? ""
  );
}

/**
 * Scans a file's comments for `@since` tags no release of the package can have stamped: one naming no version, or a
 * version newer than the package's own.
 *
 * @since 0.8.0
 */
export function scanImpossibleSinceTags(content: string, release: PackageRelease): Array<Detection> {
  if (valid(release.version) === null) {
    return [];
  }
  const detections: Array<Detection> = [];
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = sinceTagPattern.exec(line);
    if (match === null) {
      continue;
    }
    const stamped = stampedVersion(match[1] ?? "");
    const raw = stamped.length > 0 ? `@since ${stamped}` : "@since";
    if (valid(stamped) === null) {
      detections.push({ line: index + 1, raw, reason: `@since names no version — ${stampHint}` });
    } else if (gt(stamped, release.version)) {
      const reason = `@since is newer than ${release.name} ${release.version} — ${stampHint}`;
      detections.push({ line: index + 1, raw, reason });
    }
  }
  return detections;
}
