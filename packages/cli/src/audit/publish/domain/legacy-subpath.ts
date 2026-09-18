/** Detects `#/`-prefixed internal import specifiers, which Node's ESM resolver rejects on the floor. */

import type { LegacySubpathImport } from "#audit/domain/types";

// A `#/` specifier in import position — after `from`, `import(`, or `require(`. Anchoring on the keyword
// rules out an unrelated string that merely contains `#/`, such as this rule's own diagnostic text.
const LEGACY_SUBPATH_SPECIFIER = /(?:\bfrom|\bimport|\brequire)\b\s*\(?\s*(["']#\/[^"']*["'])/g;

/**
 * Every `#/`-prefixed import specifier in a source file, with its line number.
 */
export function scanLegacySubpathImports(content: string): Array<LegacySubpathImport> {
  const found: Array<LegacySubpathImport> = [];
  const lines = content.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(LEGACY_SUBPATH_SPECIFIER)) {
      const raw = match[1];
      if (raw !== undefined) {
        found.push({ line: index + 1, raw });
      }
    }
  }
  return found;
}
