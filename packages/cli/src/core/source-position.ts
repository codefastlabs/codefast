/**
 * Where an offset sits in a source text, as the audits report it.
 */

/**
 * Returns the one-based line an offset falls on.
 *
 * @since 0.13.0
 */
export function lineOfOffset(sourceText: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) {
    if (sourceText.charCodeAt(index) === 10) {
      line++;
    }
  }
  return line;
}

/**
 * Returns a text up to its first line break, so a multi-line node reports as one line.
 *
 * @since 0.13.0
 */
export function firstLineOf(text: string): string {
  const newlineIndex = text.indexOf("\n");
  return newlineIndex === -1 ? text : text.slice(0, newlineIndex);
}

/**
 * Returns the one-based line a needle first appears on, or `1` when the text does not hold it.
 */
export function lineOfText(sourceText: string, needle: string): number {
  const index = sourceText.indexOf(needle);
  return index === -1 ? 1 : lineOfOffset(sourceText, index);
}
