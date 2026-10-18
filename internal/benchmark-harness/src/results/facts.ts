/** Derives a suite's `results.json`, the typed facts a page outside the suite reads instead of parsing RESULTS.md. */
import type { ComparisonDocument } from "#report/comparison-document";

/** A library the baseline measured, at the version it ran. */
export interface ResultsLibrary {
  readonly name: string;
  readonly version: string;
}

/** One competitor's head-to-head against the subject; ratios are the subject over the competitor. */
export interface ResultsAggregate {
  readonly competitor: string;
  readonly displayName: string;
  readonly comparable: number;
  readonly wins: number;
  readonly parities: number;
  readonly losses: number;
  readonly median: number;
  readonly geomean: number;
  /** Comparable rows above the throughput ceiling, which the aggregates carry but no reader should cite alone. */
  readonly unreliable: number;
}

/** A row the subject loses, against the competitor that wins it. */
export interface ResultsLoss {
  readonly scenario: string;
  readonly competitor: string;
  readonly ratio: number;
  readonly unreliable: boolean;
}

/** What the baseline states about itself, as data rather than as prose. */
export interface ResultsFacts {
  readonly runId: string;
  /** The day the baseline ran, `YYYY-MM-DD`. */
  readonly runDate: string;
  readonly profile: {
    readonly mode: string;
    readonly isolated: boolean;
    readonly trialCount: number;
  };
  readonly environment: {
    readonly nodeVersion: string;
    readonly v8Version: string;
    readonly cpuModel: string;
    readonly cpuCount: number;
    readonly platform: string;
    readonly arch: string;
  };
  /** The subject first, then every competitor in report order. */
  readonly libraries: ReadonlyArray<ResultsLibrary>;
  readonly aggregates: ReadonlyArray<ResultsAggregate>;
  /** Every loss, per competitor in report order, then in scenario order. */
  readonly losses: ReadonlyArray<ResultsLoss>;
  /** The RESULTS.md heading the losses are explained under, as written. */
  readonly lossesHeading: string;
}

/** Builds the facts from the same comparison the page renders. */
export function buildResultsFacts(document: ComparisonDocument, lossesHeading: string): ResultsFacts {
  const { run, environment, pivot, competitors } = document;
  const libraryNameOf = (displayName: string): string => {
    const library = competitors.find((candidate) => candidate.displayName === displayName);
    if (library === undefined) {
      throw new Error(`The baseline compares ${displayName}, which it never measured.`);
    }
    return library.libraryName;
  };
  return {
    runId: run.runId,
    runDate: environment.timestampIso.slice(0, 10),
    profile: { mode: run.mode, isolated: run.isolated, trialCount: run.trialCount },
    environment: {
      nodeVersion: environment.nodeVersion,
      v8Version: environment.v8Version,
      cpuModel: environment.cpuModel,
      cpuCount: environment.cpuCount,
      platform: environment.platform,
      arch: environment.arch,
    },
    libraries: [pivot, ...competitors].map((library) => ({
      name: library.libraryName,
      version: library.libraryVersion,
    })),
    aggregates: document.headToHead.map(({ displayName, headToHead }) => ({
      competitor: libraryNameOf(displayName),
      displayName,
      comparable: headToHead.comparableCount,
      wins: headToHead.wins.length,
      parities: headToHead.parities.length,
      losses: headToHead.losses.length,
      median: headToHead.medianRatio,
      geomean: headToHead.geomeanRatio,
      unreliable: headToHead.unreliableCount,
    })),
    losses: document.headToHead.flatMap(({ displayName, headToHead }) =>
      headToHead.losses.map((entry) => ({
        scenario: entry.id,
        competitor: libraryNameOf(displayName),
        ratio: entry.ratio,
        unreliable: entry.unreliable,
      })),
    ),
    lossesHeading,
  };
}
