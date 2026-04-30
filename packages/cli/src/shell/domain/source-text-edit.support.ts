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
  const prevLineBreak = Math.max(
    source.lastIndexOf("\n", searchPos - 1),
    source.lastIndexOf("\r", searchPos - 1),
  );
  return prevLineBreak === -1 ? 0 : prevLineBreak + 1;
}

/**
 * Returns only the leading whitespace (tabs / spaces) of the line containing `pos`.
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
 * Source slice `[lineStart, pos)` for the line containing `pos`. Aligns continuation lines with
 * a token not at column 0 (e.g. `base: ["foo"` → prefix before the opening `"` of `"foo"`).
 */
export function textPrefixFromLineStartToPosition(source: string, pos: number): string {
  const searchPos = Math.max(0, Math.min(pos, source.length));
  return source.slice(lineStartIndexContaining(source, searchPos), searchPos);
}

/**
 * If `tokenEnd` is followed by optional ASCII whitespace then `,`, returns the index after that
 * comma. Otherwise returns `tokenEnd`. Useful when a replacement already ends with `,` and the
 * following source comma must be absorbed.
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

export function applyEditsDescending(
  sourceText: string,
  edits: ReadonlyArray<SourceTextEdit>,
): string {
  const sorted = [...edits].sort((editA, editB) => editB.start - editA.start);
  let out = sourceText;
  for (const edit of sorted) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}
