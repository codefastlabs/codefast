/**
 * Pure string utilities for applying non-overlapping text edits and reading line indentation.
 */

type SourceTextEdit = Readonly<{
  start: number;
  end: number;
  replacement: string;
}>;

/**
 * Returns only the leading whitespace (tabs / spaces) of the line containing `pos`.
 */
export function indentOfLineContaining(source: string, pos: number): string {
  const searchPos = Math.max(0, Math.min(pos, source.length));
  const prevLineBreak = Math.max(
    source.lastIndexOf("\n", searchPos - 1),
    source.lastIndexOf("\r", searchPos - 1),
  );
  const lineStart = prevLineBreak === -1 ? 0 : prevLineBreak + 1;

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
