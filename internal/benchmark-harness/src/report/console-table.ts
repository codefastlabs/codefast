/** Fixed-width console tables that pad every cell as plain text before any colour goes on. */
import type { Tint } from "#/shared/palette";

const IDENTITY: Tint = (text) => text;

/**
 * One cell: the plain text that sets the column width, and the tint applied after padding.
 *
 * @since 0.9.0
 */
export interface ConsoleCell {
  readonly text: string;
  readonly tint?: Tint | undefined;
  readonly align?: "left" | "right" | undefined;
}

/**
 * Options for {@link renderConsoleTable}.
 *
 * @since 0.9.0
 */
export interface RenderConsoleTableOptions {
  /** Tint for the header row; the header is padded like any other row first. */
  readonly headerTint?: Tint | undefined;
  readonly gap?: string | undefined;
}

/**
 * Turns a plain string into a cell.
 *
 * @since 0.9.0
 */
export function cell(text: string, tint?: Tint, align?: "left" | "right"): ConsoleCell {
  return { text, tint, align };
}

/**
 * Renders a header and rows into aligned lines; numeric-looking columns should pass `align: "right"`.
 *
 * @since 0.9.0
 */
export function renderConsoleTable(
  header: ReadonlyArray<ConsoleCell>,
  rows: ReadonlyArray<ReadonlyArray<ConsoleCell>>,
  options: RenderConsoleTableOptions = {},
): Array<string> {
  const gap = options.gap ?? "  ";
  const columnCount = Math.max(header.length, ...rows.map((row) => row.length));
  const widths = Array.from({ length: columnCount }, (_, index) =>
    Math.max(header[index]?.text.length ?? 0, ...rows.map((row) => row[index]?.text.length ?? 0)),
  );
  // The last column is never padded on the right, so a tinted row carries no trailing blanks.
  const renderRow = (row: ReadonlyArray<ConsoleCell>, rowTint: Tint): string =>
    widths
      .map((width, index) => {
        const current = row[index] ?? { text: "" };
        const align = current.align ?? header[index]?.align ?? "left";
        const isLast = index === widths.length - 1;
        const padded =
          align === "right" ? current.text.padStart(width) : isLast ? current.text : current.text.padEnd(width);
        return rowTint((current.tint ?? IDENTITY)(padded));
      })
      .join(gap);
  return [renderRow(header, options.headerTint ?? IDENTITY), ...rows.map((row) => renderRow(row, IDENTITY))];
}
