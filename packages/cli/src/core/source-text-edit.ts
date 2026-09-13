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
 * Returns the edits with every overlap removed, keeping the outermost of any overlapping pair.
 *
 * @remarks A planned edit replaces a whole AST node, so two ranges either nest or are disjoint and
 * the outer replacement already contains the inner span verbatim — dropping the nested edit keeps
 * the output valid. Higher-priority edits must come first so an exact-range tie keeps the earlier
 * one. This is the invariant `applyEditsDescending` assumes; run it before applying.
 *
 * @since 0.11.0
 */
export function dropOverlappingEdits<Edit extends { start: number; end: number }>(
  edits: ReadonlyArray<Edit>,
): Array<Edit> {
  const ordered = [...edits].toSorted((editA, editB) => editA.start - editB.start || editB.end - editA.end);
  const kept: Array<Edit> = [];
  let lastEnd = -1;
  for (const edit of ordered) {
    if (edit.start >= lastEnd) {
      kept.push(edit);
      lastEnd = edit.end;
    }
  }
  return kept;
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
