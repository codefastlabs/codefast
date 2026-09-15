/** The A/B request parsed from a `bench:ab` command line: rows, both sides, experiments, profile. */

/** The timing profile a paired A/B run measures each side under. */
export type AbMode = "fast" | "default" | "full";

const AB_MODES: ReadonlyArray<AbMode> = ["fast", "default", "full"];

/** A resolved A/B request: the rows, the two sides, how many experiments, and the timing profile. */
export interface AbRequest {
  readonly ids: ReadonlySet<string>;
  readonly baseRef: string;
  /** A git ref for the new side, or `undefined` to measure the working tree as-is. */
  readonly newRef: string | undefined;
  readonly experiments: number;
  readonly mode: AbMode;
}

/**
 * Parses a `bench:ab` argument vector into a request.
 *
 * @remarks Throws on a malformed flag or value rather than measuring the wrong thing silently; a bare
 * `--` is the runner's separator (pnpm and turbo forward it), not a flag.
 */
export function parseAbRequest(argv: ReadonlyArray<string>): AbRequest {
  const positional: Array<string> = [];
  let baseRef = "HEAD~1";
  let newRef: string | undefined;
  let experimentsRaw = "2";
  let mode: AbMode = "full";
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === undefined || token === "--") {
      continue;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const value = argv[index + 1];
    index++;
    if (value === undefined) {
      throw new Error(`flag ${token} needs a value`);
    }
    if (token === "--base") {
      baseRef = value;
    } else if (token === "--new") {
      newRef = value;
    } else if (token === "--experiments") {
      experimentsRaw = value;
    } else if (token === "--mode") {
      const candidate = AB_MODES.find((entry) => entry === value);
      if (candidate === undefined) {
        throw new Error(`--mode must be one of ${AB_MODES.join(", ")}`);
      }
      mode = candidate;
    } else {
      throw new Error(`unknown flag ${token}`);
    }
  }
  const first = positional[0];
  if (first === undefined) {
    throw new Error("give at least one scenario id, comma-separated, e.g. `bench:ab -- tagged-binding-resolve`");
  }
  const ids = new Set(
    first
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
  if (ids.size === 0) {
    throw new Error("no scenario id parsed from the first argument");
  }
  const experiments = Number(experimentsRaw);
  if (!Number.isInteger(experiments) || experiments < 1) {
    throw new Error("--experiments must be a whole number of at least 1");
  }
  return { ids, baseRef, newRef, experiments, mode };
}
