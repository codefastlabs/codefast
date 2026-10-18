import * as z from "zod";

import { slugify } from "#features/package-docs/lib/markdown/slug";

/** The part of `benchmarks/di/results.json` the home page reads; `pnpm bench:results` writes it beside RESULTS.md. */
const ResultsFactsSchema = z.object({
  runDate: z.iso.date(),
  profile: z.object({ mode: z.string(), isolated: z.boolean(), trialCount: z.int().positive() }),
  environment: z.object({
    nodeVersion: z.string(),
    v8Version: z.string(),
    cpuModel: z.string(),
    cpuCount: z.int().positive(),
    platform: z.string(),
    arch: z.string(),
  }),
  libraries: z.array(z.object({ name: z.string(), version: z.string() })).min(1),
  aggregates: z.array(
    z.object({
      competitor: z.string(),
      wins: z.int().nonnegative(),
      parities: z.int().nonnegative(),
      losses: z.int().nonnegative(),
      median: z.number().positive(),
      geomean: z.number().positive(),
    }),
  ),
  lossesHeading: z.string(),
});

/** A library the suite compares, with the version the ledger last measured. */
interface LedgerLibrary {
  readonly name: string;
  readonly version: string;
}

/** One competitor's line of the suite aggregates: rows won, tied and lost, and the two summary ratios over it. */
interface LedgerAggregate {
  readonly competitor: string;
  readonly wins: number;
  readonly parities: number;
  readonly losses: number;
  readonly median: number;
  readonly geomean: number;
}

/** What the ledger states about its own runs: the cast, the profile, the aggregates, and where it loses. */
export interface LedgerFacts {
  /** The libraries the suite runs the same workloads through, `@codefast/di` first, in the ledger's order. */
  readonly libraries: ReadonlyArray<LedgerLibrary>;
  /** The runtime and machine the baseline ran on, or an empty string when there is no baseline. */
  readonly environment: string;
  /** The day of the last full re-measure, or null when the ledger records none. */
  readonly lastFullRemeasure: string | null;
  /** The profile the suite aggregates were measured under, or an empty string when there is no baseline. */
  readonly aggregateProfile: string;
  /** The suite aggregates, one line per competitor, in the ledger's order. */
  readonly aggregates: ReadonlyArray<LedgerAggregate>;
  /** The GitHub anchor of the section that explains the losses, or an empty string when the ledger has none. */
  readonly lossesAnchor: string;
}

/** The facts of a ledger with no baseline: no cast, no scoreboard. */
export const EMPTY_LEDGER_FACTS: LedgerFacts = {
  libraries: [],
  environment: "",
  lastFullRemeasure: null,
  aggregateProfile: "",
  aggregates: [],
  lossesAnchor: "",
};

/**
 * Reads the ledger's facts out of its `results.json`; a file that does not match the schema, or whose aggregates
 * are not one line per competitor, throws.
 */
export function parseLedgerFacts(results: unknown): LedgerFacts {
  const { runDate, profile, environment, libraries, aggregates, lossesHeading } = ResultsFactsSchema.parse(results);

  if (aggregates.length !== libraries.length - 1) {
    throw new Error(
      `The benchmark ledger names ${String(libraries.length)} libraries but has ${String(aggregates.length)} aggregate lines, not one per competitor.`,
    );
  }

  return {
    libraries,
    environment: `Node ${environment.nodeVersion} / V8 ${environment.v8Version}, ${environment.cpuModel} × ${String(environment.cpuCount)}, ${environment.platform}/${environment.arch}`,
    lastFullRemeasure: profile.mode === "full" ? runDate : null,
    aggregateProfile: [
      `${profile.mode} profile`,
      `${String(profile.trialCount)} ${profile.trialCount === 1 ? "trial" : "trials"}`,
      profile.isolated ? "one subprocess per scenario" : "one process for every scenario",
    ].join(" · "),
    aggregates,
    lossesAnchor: lossesHeading === "" ? "" : slugify(lossesHeading),
  };
}
