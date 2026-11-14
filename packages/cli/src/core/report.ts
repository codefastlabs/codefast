import path from "node:path";

import type { Verdict } from "#core/command";
import { logger } from "#core/logger";
import { paint } from "#core/style";

/**
 * Something at a location in the project that a person must look at.
 */
export interface Finding {
  /** The file as a POSIX path from the root. */
  readonly file: string;
  readonly line: number;
  /** The offending text as written, up to its first line break. */
  readonly text: string;
  readonly message: string;
}

/**
 * What a command did to one package: wrote it, found nothing to change, passed over it, or failed on it.
 */
type PackageStatus = "changed" | "unchanged" | "skipped" | "failed";

/**
 * The outcome of a writing command on one package.
 */
export interface PackageOutcome {
  readonly name: string;
  /** The package directory as a POSIX path from the root. */
  readonly directory: string;
  readonly status: PackageStatus;
  /** Why the package was skipped or failed. */
  readonly reason: string | null;
  /** The files written, as POSIX paths from the root, or those a dry run would write. */
  readonly files: ReadonlyArray<string>;
}

const TEXT_WIDTH = 80;

function clip(text: string): string {
  return text.length <= TEXT_WIDTH ? text : `${text.slice(0, TEXT_WIDTH - 1)}…`;
}

/**
 * Prints findings grouped under their file, one `line: text → message` row each.
 */
export function presentFindings(findings: ReadonlyArray<Finding>): void {
  let file: string | undefined;
  for (const finding of findings) {
    if (finding.file !== file) {
      file = finding.file;
      logger.out(`\n${paint("bold", file)}`);
    }
    logger.out(`  ${paint("dim", `${finding.line}:`)} ${clip(finding.text)} ${paint("dim", "→")} ${finding.message}`);
  }
}

const statusMarks: Readonly<Record<PackageStatus, readonly [style: "cyan" | "green" | "dim" | "red", mark: string]>> = {
  changed: ["cyan", "✎"],
  unchanged: ["green", "✓"],
  skipped: ["dim", "○"],
  failed: ["red", "✗"],
};

/**
 * Prints one row per package outcome: its mark, its name, and what happened to it.
 */
export function presentPackageOutcomes<Outcome extends PackageOutcome>(
  outcomes: ReadonlyArray<Outcome>,
  describe: (outcome: Outcome) => string,
): void {
  const width = Math.max(0, ...outcomes.map((outcome) => outcome.name.length));
  for (const outcome of outcomes) {
    const detail = outcome.reason ?? describe(outcome);
    const name = outcome.name.padEnd(width);
    const [style, mark] = statusMarks[outcome.status];
    logger.out(`${paint(style, mark)} ${outcome.status === "skipped" ? paint("dim", name) : name}  ${detail}`);
  }
}

/**
 * Counts package outcomes by status, as the summary of a writing command reads them.
 */
export function countPackageOutcomes(outcomes: ReadonlyArray<PackageOutcome>): string {
  const counts: Array<string> = [];
  for (const status of ["failed", "changed", "unchanged", "skipped"] as const) {
    const count = outcomes.filter((outcome) => outcome.status === status).length;
    if (count > 0) {
      counts.push(`${count} ${status}`);
    }
  }
  return counts.length === 0 ? "no packages" : counts.join(", ");
}

/**
 * Prints the one summary line every command ends with: a pass or fail mark, the text, and the time it took.
 */
export function presentSummary(passed: boolean, text: string, elapsedSeconds: number): void {
  const mark = passed ? paint("green", "✓") : paint("red", "✗");
  logger.out(`\n${mark} ${text} ${paint("dim", `(${elapsedSeconds.toFixed(2)}s)`)}`);
}

/**
 * Returns the verdict of a writing command: it fails when any package failed.
 */
export function packagesVerdict(outcomes: ReadonlyArray<PackageOutcome>): Verdict {
  return outcomes.some((outcome) => outcome.status === "failed") ? "fail" : "pass";
}

/**
 * Returns the absolute paths a writing command wrote, none on a dry run.
 */
export function writtenPackageFiles(
  outcomes: ReadonlyArray<PackageOutcome>,
  rootDir: string,
  dryRun: boolean,
): Array<string> {
  return dryRun ? [] : outcomes.flatMap((outcome) => outcome.files.map((file) => path.join(rootDir, file)));
}
