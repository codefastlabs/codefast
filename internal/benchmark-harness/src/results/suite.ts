/** What a suite hands the results generator: its cast, its notes, and the prose only it can write. */
import type { ComparisonDocument } from "#report/comparison-document";
import type { ParsedRun } from "#report/jsonl";
import type { ResultsNotes } from "#results/notes";
import type { BenchSubprocessConfig } from "#shared/config";
import type { BenchRunShape } from "#shared/env-keys";

/**
 * A competitor whose `libraryName` is one of the names the suite's notes may quote.
 *
 * @since 0.12.0
 */
export interface ResultsCompetitor<Name extends string = string> extends BenchSubprocessConfig {
  readonly libraryName: Name;
}

/**
 * The sentences of the page that describe the suite rather than the run.
 *
 * @since 0.12.0
 */
export interface ResultsCopy {
  /** Closes the baseline paragraph: what a `—` cell means in this suite. */
  readonly coverage: string;
  /** Closes the environment paragraph: how every library is configured for the run. */
  readonly environment: string;
  /** Opens the user-facing section: which measurements an application feels, and why they lead. */
  readonly userFacingIntro: string;
  /** Opens the bundle paragraph after its bold label: what `pnpm bench:footprint` bundles, with which bundler. */
  readonly bundleLead: (bundler: string) => string;
  /** Explains the rows of the full table no competitor runs. */
  readonly subjectOnlyRows: string;
  /** Follows the list of rows kept out of the aggregates: why they are. */
  readonly excludedReason: string;
  /** Closes the re-running section: how to narrow a run, and how to see which rows each library implements. */
  readonly listing: string;
}

/**
 * Inputs a suite's comparison needs when it is assembled from a committed run rather than a live one.
 *
 * @since 0.12.0
 */
export interface ResultsComparisonOptions {
  readonly runId: string;
  readonly runOrder: string;
  readonly shape: BenchRunShape;
}

/**
 * Everything a suite declares to generate its RESULTS.md and results.json.
 *
 * @since 0.12.0
 */
export interface ResultsSuite<Name extends string = string> {
  /** The suite's directory from the repository root, named in the re-running recipe. */
  readonly directory: string;
  /** The page's link to the measurement standard, relative to the suite's directory. */
  readonly benchGuide: string;
  readonly subject: BenchSubprocessConfig;
  /** Every competitor, in comparison-column order. */
  readonly competitors: ReadonlyArray<ResultsCompetitor<Name>>;
  readonly notes: ResultsNotes<Name>;
  readonly copy: ResultsCopy;
  /** Builds the comparison the page renders, the same way the suite's report entry does. */
  readonly assemble: (libraries: ParsedRun["libraries"], options: ResultsComparisonOptions) => ComparisonDocument;
}
