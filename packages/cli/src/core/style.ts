import process from "node:process";
import { styleText } from "node:util";

/**
 * A style `util.styleText` accepts: one format name, or several applied together.
 */
export type TextStyle = Parameters<typeof styleText>[0];

let colorRefused = false;

/**
 * Refuses or restores ANSI color for every later `paint` call, as the global `--no-color` flag asks.
 */
export function refuseColor(refused: boolean): void {
  colorRefused = refused;
}

/**
 * Styles text for the stream it is written to, plain when `--no-color`, `NO_COLOR` or a non-TTY stream refuses color.
 */
export function paint(style: TextStyle, text: string, stream: NodeJS.WriteStream = process.stdout): string {
  return colorRefused ? text : styleText(style, text, { stream, validateStream: true });
}
