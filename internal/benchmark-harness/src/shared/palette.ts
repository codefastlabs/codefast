/** Terminal colours for the progress block and the console report, resolved once per output stream. */
import { styleText } from "node:util";

/**
 * Wraps text in one colour role, or returns it untouched when colour is off.
 *
 * @since 0.9.0
 */
export type Tint = (text: string) => string;

/**
 * The colour roles the harness draws with; every role is a no-op on a stream without colour.
 *
 * @since 0.9.0
 */
export interface Palette {
  readonly enabled: boolean;
  readonly heading: Tint;
  readonly dim: Tint;
  readonly win: Tint;
  readonly loss: Tint;
  readonly parity: Tint;
  readonly running: Tint;
  readonly done: Tint;
  readonly failed: Tint;
}

/**
 * Options for {@link createPalette}.
 *
 * @since 0.9.0
 */
export interface CreatePaletteOptions {
  /** The stream the coloured text goes to; colour is on only when it is an interactive terminal. */
  readonly stream?: NodeJS.WriteStream | undefined;
  readonly env?: NodeJS.ProcessEnv | undefined;
  /** Forces colour on or off, for tests and for callers that already decided. */
  readonly enabled?: boolean | undefined;
}

/**
 * True when colour belongs on the stream: `NO_COLOR` wins, then `FORCE_COLOR`, then whether it is a TTY.
 *
 * @since 0.9.0
 */
export function shouldColor(stream: NodeJS.WriteStream, env: NodeJS.ProcessEnv): boolean {
  if (env["NO_COLOR"] !== undefined || env["NODE_DISABLE_COLORS"] !== undefined) {
    return false;
  }
  const forceColor = env["FORCE_COLOR"];
  if (forceColor !== undefined) {
    return forceColor !== "0" && forceColor !== "false";
  }
  return stream.isTTY === true && env["TERM"] !== "dumb";
}

type Format = Parameters<typeof styleText>[0];

function tint(enabled: boolean, format: Format): Tint {
  return enabled ? (text) => styleText(format, text, { validateStream: false }) : (text) => text;
}

/**
 * Builds the palette for one stream.
 *
 * @since 0.9.0
 */
export function createPalette(options: CreatePaletteOptions = {}): Palette {
  const stream = options.stream ?? process.stdout;
  const env = options.env ?? process.env;
  const enabled = options.enabled ?? shouldColor(stream, env);
  return {
    enabled,
    heading: tint(enabled, "bold"),
    dim: tint(enabled, "dim"),
    win: tint(enabled, "green"),
    loss: tint(enabled, "red"),
    parity: tint(enabled, "dim"),
    running: tint(enabled, "cyan"),
    done: tint(enabled, "green"),
    failed: tint(enabled, ["red", "bold"]),
  };
}

/**
 * A palette that never colours, for output that must stay byte-for-byte plain.
 *
 * @since 0.9.0
 */
export const PLAIN_PALETTE: Palette = createPalette({ enabled: false });
