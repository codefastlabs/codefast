/** Picks the progress display a run gets from what its stderr can draw. */
import { LiveProgressDisplay } from "#/parent/progress/live-progress-display";
import { PlainProgressDisplay } from "#/parent/progress/plain-progress-display";
import type { ProgressDisplay } from "#/parent/progress/progress-display";

/**
 * Options for {@link createProgressDisplay}.
 */
export interface CreateProgressDisplayOptions {
  /** Verbose runs stream every child line, which an in-place block would fight with. */
  readonly verbose: boolean;
  readonly stream?: NodeJS.WriteStream | undefined;
  readonly env?: NodeJS.ProcessEnv | undefined;
}

/**
 * True when the stream is an interactive terminal that can take cursor movement.
 */
export function canDrawLiveProgress(stream: NodeJS.WriteStream, env: NodeJS.ProcessEnv): boolean {
  return stream.isTTY === true && env["CI"] === undefined && env["TERM"] !== "dumb";
}

/**
 * True when the locale or platform makes block-drawing characters a safe bet.
 */
export function prefersUnicodeBars(env: NodeJS.ProcessEnv, platform: NodeJS.Platform = process.platform): boolean {
  if (platform === "darwin") {
    return true;
  }
  const locale = [env["LC_ALL"], env["LC_CTYPE"], env["LANG"]].filter((value) => value !== undefined).join(" ");
  return /utf-?8/i.test(locale);
}

/**
 * A live block on an interactive stderr, otherwise one line per milestone.
 */
export function createProgressDisplay(options: CreateProgressDisplayOptions): ProgressDisplay {
  const stream = options.stream ?? process.stderr;
  const env = options.env ?? process.env;
  if (!options.verbose && canDrawLiveProgress(stream, env)) {
    return new LiveProgressDisplay({ stream, unicode: prefersUnicodeBars(env) });
  }
  return new PlainProgressDisplay({ write: (line) => stream.write(`${line}\n`) });
}
