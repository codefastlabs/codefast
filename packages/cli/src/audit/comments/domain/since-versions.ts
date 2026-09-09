/**
 * Flags `@since` tags naming a version the owning package has not reached.
 */

/**
 * One impossible `@since` stamp found in a file's comments.
 *
 * @since 0.8.0
 */
export interface SinceVersionFinding {
  readonly line: number;
  readonly raw: string;
}

interface ParsedVersion {
  readonly core: readonly [number, number, number];
  readonly prerelease: ReadonlyArray<string>;
}

const versionPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/;
// `@since` appears only inside comments; matching the comment lead-in keeps code and prose out.
const sinceLinePattern = /^\s*(?:\*|\/\/|\/\*+)\s*@since\s+(\S+)/;
const numericIdentifierPattern = /^\d+$/;

function parseVersion(value: string): ParsedVersion | null {
  const match = versionPattern.exec(value);
  if (match === null) {
    return null;
  }

  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] === undefined ? [] : match[4].split("."),
  };
}

/**
 * Compares two SemVer strings by precedence — positive when `left` is greater,
 * null when either side is not a SemVer version.
 *
 * @since 0.8.0
 */
export function compareVersionPrecedence(left: string, right: string): number | null {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (a === null || b === null) {
    return null;
  }

  for (let index = 0; index < 3; index++) {
    if (a.core[index] !== b.core[index]) {
      return a.core[index]! - b.core[index]!;
    }
  }

  // A pre-release ranks below the release it precedes.
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return b.prerelease.length - a.prerelease.length;
  }

  const shared = Math.min(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < shared; index++) {
    const leftId = a.prerelease[index]!;
    const rightId = b.prerelease[index]!;
    const leftIsNumeric = numericIdentifierPattern.test(leftId);
    const rightIsNumeric = numericIdentifierPattern.test(rightId);

    if (leftIsNumeric && rightIsNumeric) {
      const difference = Number(leftId) - Number(rightId);
      if (difference !== 0) {
        return difference;
      }
    } else if (leftIsNumeric !== rightIsNumeric) {
      // Numeric identifiers rank below alphanumeric ones.
      return leftIsNumeric ? -1 : 1;
    } else if (leftId !== rightId) {
      return leftId < rightId ? -1 : 1;
    }
  }

  return a.prerelease.length - b.prerelease.length;
}

/**
 * Scans a file's comments for `@since` tags stamped above the package's current
 * version — a release that has not happened, so the stamp cannot be true.
 *
 * @since 0.8.0
 */
export function scanImpossibleSinceTags(content: string, packageVersion: string): Array<SinceVersionFinding> {
  if (parseVersion(packageVersion) === null) {
    return [];
  }

  const findings: Array<SinceVersionFinding> = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index++) {
    const match = sinceLinePattern.exec(lines[index]!);
    if (match === null) {
      continue;
    }
    const stamped = match[1]!;
    const comparison = compareVersionPrecedence(stamped, packageVersion);
    if (comparison !== null && comparison > 0) {
      findings.push({ line: index + 1, raw: `@since ${stamped}` });
    }
  }

  return findings;
}
