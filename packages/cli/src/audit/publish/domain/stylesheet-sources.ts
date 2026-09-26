/** Reads the paths a stylesheet registers with Tailwind's `@source` and checks them against a shipped file list. */

import path from "node:path";

import type { StylesheetSource } from "#audit/domain/types";
import { createAnyGlobMatcher } from "#core/glob";
import { lineOfOffset } from "#core/source-position";

// A plain `@source "<path>";` — `@source not …` excludes paths and `@source inline(…)` names classes, so neither
// registers files.
const SOURCE_DIRECTIVE = /@source\s+(["'])([^"']+)\1\s*;/g;

// A string or a comment. Strings match first, so the `/**/` of a quoted glob is never read as a comment.
const STRING_OR_COMMENT = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\//g;

const GLOB_CHARACTERS = /[*?[\]{}]/;

/**
 * Every path a stylesheet registers with `@source`, with the line it sits on.
 *
 * @since 0.13.0
 */
export function scanStylesheetSources(content: string): Array<StylesheetSource> {
  // Blanking comments keeps every offset in place, so a commented-out directive drops out and lines still count.
  const code = content.replaceAll(
    STRING_OR_COMMENT,
    (match, quoted: string | undefined) => quoted ?? match.replaceAll(/[^\n]/g, " "),
  );
  const found: Array<StylesheetSource> = [];
  for (const match of code.matchAll(SOURCE_DIRECTIVE)) {
    const pattern = match[2];
    if (pattern !== undefined) {
      found.push({ line: lineOfOffset(code, match.index), pattern });
    }
  }
  return found;
}

/**
 * Whether a stylesheet's `@source` paths all miss the files its package ships.
 *
 * @remarks Paths are package-relative and POSIX. A path that leaves the package names another package's files, which
 * this tarball cannot vouch for, so it is not judged. One reachable path is enough: a workspace-only lane beside the
 * published one is expected.
 *
 * @param stylesheetPath - The stylesheet, relative to its package root.
 * @param sources - What {@link scanStylesheetSources} found in it.
 * @param shippedFiles - Every file the package's tarball ships, relative to the package root.
 *
 * @since 0.13.0
 */
export function missesShippedFiles(
  stylesheetPath: string,
  sources: ReadonlyArray<StylesheetSource>,
  shippedFiles: ReadonlyArray<string>,
): boolean {
  const patterns = sources.flatMap((source) => packagePatternsFor(stylesheetPath, source.pattern));
  if (patterns.length === 0) {
    return false;
  }
  const isReached = createAnyGlobMatcher(patterns, { dot: true });
  return !shippedFiles.some(isReached);
}

// Tailwind resolves a `@source` path against the stylesheet's directory; a path without a glob is a file or a
// directory, and a directory registers everything beneath it.
function packagePatternsFor(stylesheetPath: string, pattern: string): Array<string> {
  if (path.posix.isAbsolute(pattern)) {
    return [];
  }
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(stylesheetPath), pattern));
  if (resolved === ".." || resolved.startsWith("../")) {
    return [];
  }
  if (GLOB_CHARACTERS.test(resolved)) {
    return [resolved];
  }
  const withoutTrailingSlash = resolved.replace(/\/+$/, "");
  return withoutTrailingSlash === "." ? ["**"] : [withoutTrailingSlash, `${withoutTrailingSlash}/**`];
}
