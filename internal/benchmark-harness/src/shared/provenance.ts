/** The commit a run's harness measured from, and whether two commits share the harness's measuring sources. */
import { spawnSync } from "node:child_process";

/**
 * Where a run's harness came from: the commit it ran at, and whether its measuring sources were clean.
 *
 * @remarks Stamped on every observation so a later diff can tell an engine change from a harness change.
 *
 * @since 0.11.0
 */
export interface HarnessProvenance {
  /** The repository commit the harness ran from, as a full SHA. */
  readonly harnessCommit: string;
  /** Whether any measuring source carried an uncommitted change when the run started. */
  readonly harnessDirty: boolean;
}

/**
 * The harness sources a child executes, relative to the repository root.
 *
 * @remarks A change here changes what a measurement means; the report renderers do not, so they stay out.
 *
 * @since 0.11.0
 */
export const HARNESS_MEASURING_PATHS: ReadonlyArray<string> = [
  "internal/benchmark-harness/src/child",
  "internal/benchmark-harness/src/shared",
];

/**
 * How the measuring sources at one commit compare to those at another.
 *
 * @since 0.11.0
 */
export type HarnessSourceComparison = "same" | "changed" | "unknown";

/**
 * Answers whether the measuring sources differ between two commits.
 *
 * @since 0.11.0
 */
export type CompareHarnessSources = (fromCommit: string, toCommit: string) => HarnessSourceComparison;

interface GitResult {
  readonly status: number | null;
  readonly stdout: string;
}

function git(directory: string, args: ReadonlyArray<string>): GitResult {
  const result = spawnSync("git", ["-C", directory, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return { status: result.status, stdout: result.stdout ?? "" };
}

function repositoryTop(directory: string): string | undefined {
  const top = git(directory, ["rev-parse", "--show-toplevel"]);
  return top.status === 0 ? top.stdout.trim() : undefined;
}

/**
 * Reads the harness's provenance for a run started from `directory`, or nothing outside a git checkout.
 *
 * @remarks A run that records nothing can never be diffed against, the honest outcome for a tree git cannot describe.
 *
 * @since 0.11.0
 */
export function readHarnessProvenance(directory: string): HarnessProvenance | undefined {
  const top = repositoryTop(directory);
  if (top === undefined) {
    return undefined;
  }
  const head = git(top, ["rev-parse", "HEAD"]);
  if (head.status !== 0) {
    return undefined;
  }
  const status = git(top, ["status", "--porcelain", "--untracked-files=all", "--", ...HARNESS_MEASURING_PATHS]);
  if (status.status !== 0) {
    return undefined;
  }
  return { harnessCommit: head.stdout.trim(), harnessDirty: status.stdout.trim().length > 0 };
}

/**
 * Creates a comparer that asks the checkout at `directory` whether the measuring sources differ between two commits.
 *
 * @remarks Equal commits are the same without asking; a commit the checkout cannot see reads as unknown, never as same.
 *
 * @since 0.11.0
 */
export function createHarnessSourceComparer(directory: string): CompareHarnessSources {
  return (fromCommit, toCommit) => {
    if (fromCommit === toCommit) {
      return "same";
    }
    const top = repositoryTop(directory);
    if (top === undefined) {
      return "unknown";
    }
    const diff = git(top, ["diff", "--quiet", fromCommit, toCommit, "--", ...HARNESS_MEASURING_PATHS]);
    if (diff.status === 0) {
      return "same";
    }
    return diff.status === 1 ? "changed" : "unknown";
  };
}
