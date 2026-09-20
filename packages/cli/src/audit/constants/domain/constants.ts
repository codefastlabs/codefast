/** The numeric-constant convention: a `const NAME = <number>` in a source tree names the kind of number it is. */
import type { ConstantViolation } from "#audit/domain/types";

/**
 * The three kinds a numeric constant may be, each named by one phrase in the comment above it.
 *
 * @remarks A width of the machine, a value the contract fixes, or a figure derived from the data a
 * bind hands in. A count that merely looks reasonable is none of them, and the audit says so.
 */
const KIND_PHRASES: ReadonlyArray<string> = [
  "a constant of the machine",
  "a value the contract fixes",
  "derived from bind-time data",
];

/** An upper-case `const` bound to a numeric literal, with an optional type annotation. */
const NUMERIC_CONST = /^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*(-?\d[\d_]*(?:\.\d+)?)(?![\w.])/;

/** Values that stand for absence or identity, never for a tuned size: any distinct value would do. */
const SENTINEL_VALUES: ReadonlySet<string> = new Set(["0", "1", "-1"]);

/**
 * Scans one TypeScript source for numeric constants whose comment names none of the three kinds.
 *
 * @since 0.11.0
 */
export function auditNumericConstants(sourceText: string): Array<ConstantViolation> {
  const lines = sourceText.split("\n");
  const violations: Array<ConstantViolation> = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = NUMERIC_CONST.exec(lines[index]!);
    if (match === null || SENTINEL_VALUES.has(match[2]!)) {
      continue;
    }
    const comment = commentAbove(lines, index);
    if (KIND_PHRASES.some((phrase) => comment.includes(phrase))) {
      continue;
    }
    violations.push({
      line: index + 1,
      raw: `${match[1]!} = ${match[2]!}`,
      reason: `no kind named above it — say which it is: ${KIND_PHRASES.join(" · ")}`,
    });
  }
  return violations;
}

/** The doc block or run of `//` lines directly above a line, as one text; empty when there is none. */
function commentAbove(lines: ReadonlyArray<string>, index: number): string {
  let cursor = index - 1;
  const gathered: Array<string> = [];
  while (cursor >= 0) {
    const line = lines[cursor]!.trim();
    if (line.startsWith("//")) {
      gathered.unshift(line);
      cursor -= 1;
      continue;
    }
    if (line.endsWith("*/")) {
      // Walk back to the opening of the block, collecting it whole.
      while (cursor >= 0) {
        gathered.unshift(lines[cursor]!.trim());
        if (lines[cursor]!.trim().startsWith("/*")) {
          break;
        }
        cursor -= 1;
      }
      break;
    }
    break;
  }
  return gathered.join(" ");
}
