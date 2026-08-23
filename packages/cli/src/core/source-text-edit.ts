/**
 * Pure string utilities for applying non-overlapping text edits and reading line indentation.
 */

type SourceTextEdit = Readonly<{
  start: number;
  end: number;
  replacement: string;
}>;

function lineStartIndexContaining(source: string, pos: number): number {
  const searchPos = Math.max(0, Math.min(pos, source.length));
  const prevLineBreak = Math.max(source.lastIndexOf("\n", searchPos - 1), source.lastIndexOf("\r", searchPos - 1));
  return prevLineBreak === -1 ? 0 : prevLineBreak + 1;
}

/**
 * Returns the leading whitespace of the line containing a position.
 *
 * @since 0.3.16-canary.0
 */
export function indentOfLineContaining(source: string, pos: number): string {
  const lineStart = lineStartIndexContaining(source, pos);

  let lineEnd = source.length;
  for (let i = lineStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\n" || ch === "\r") {
      lineEnd = i;
      break;
    }
  }

  const line = source.slice(lineStart, lineEnd);
  const indentMatch = /^[\t ]*/.exec(line);
  return indentMatch?.[0] ?? "";
}

/**
 * Returns the text from the start of a position's line up to that position.
 *
 * @since 0.3.16-canary.0
 */
export function textPrefixFromLineStartToPosition(source: string, pos: number): string {
  const searchPos = Math.max(0, Math.min(pos, source.length));
  return source.slice(lineStartIndexContaining(source, searchPos), searchPos);
}

/**
 * Extends a token's end position past any whitespace-separated trailing comma.
 *
 * @since 0.3.16-canary.0
 */
export function endAfterOptionalCommaFollowingInSource(source: string, tokenEnd: number): number {
  let index = tokenEnd;
  while (index < source.length) {
    const ch = source[index];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      index += 1;
      continue;
    }
    if (ch === ",") {
      return index + 1;
    }
    break;
  }
  return tokenEnd;
}

/**
 * Applies non-overlapping text edits from the highest offset down and returns the edited source.
 *
 * @since 0.3.16-canary.0
 */
export function applyEditsDescending(sourceText: string, edits: ReadonlyArray<SourceTextEdit>): string {
  const sorted = [...edits].toSorted((editA, editB) => editB.start - editA.start);
  let out = sourceText;
  for (const edit of sorted) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}
