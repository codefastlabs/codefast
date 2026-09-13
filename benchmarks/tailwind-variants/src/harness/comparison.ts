/** The head-to-head comparison assembled from each library's payloads, shared by the run and report entries. */
import { buildLibraryReport } from "@internal/benchmark-harness/report/aggregate";
import type { LibraryReport } from "@internal/benchmark-harness/report/aggregate";
import type { ComparisonLibrary } from "@internal/benchmark-harness/report/comparison";
import { renderComparisonMarkdownReport } from "@internal/benchmark-harness/report/comparison";
import { buildComparisonDocument } from "@internal/benchmark-harness/report/comparison-document";
import type { ComparisonDocument } from "@internal/benchmark-harness/report/comparison-document";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";
import type { BenchRunShape } from "@internal/benchmark-harness/shared/env-keys";
import type { Fingerprint, TrialPayload } from "@internal/benchmark-harness/shared/protocol";

import { SCENARIO_BASELINES } from "#/fixtures/scenario-parity";
import { CODEFAST_TV, COMPETITORS } from "#/harness/config";
import type { TvBenchLibrary } from "#/harness/config";
import { TAILWIND_VARIANTS_COMPARISON_MARKDOWN } from "#/harness/presentation";

/** One library's fingerprint and per-trial payloads, live from a run or reconstructed from disk. */
export interface LibraryPayload {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
  readonly sanityFailures?: ReadonlyArray<string> | undefined;
}

function toLibrary(payload: LibraryPayload, library: TvBenchLibrary): ComparisonLibrary {
  const report: LibraryReport = buildLibraryReport(payload.fingerprint, payload.trials, payload.sanityFailures ?? []);
  return { report, displayName: resolveDisplayName(library), shortName: library.shortName };
}

/** The assembled comparison: the pivot, its competitors, the markdown report, and the document. */
export interface TvComparison {
  readonly codefastLibrary: ComparisonLibrary;
  readonly competitors: ReadonlyArray<ComparisonLibrary>;
  readonly markdown: string;
  readonly comparisonDocument: ComparisonDocument;
}

/** Inputs a comparison needs beyond the payloads: the run id, its order caveat, and its shape. */
export interface AssembleTvComparisonOptions {
  readonly runId: string;
  readonly runOrder: string;
  readonly scenariosAvailable?: number | undefined;
  /** Omitted for a live run (read from the environment); supplied when deriving from disk. */
  readonly shape?: BenchRunShape | undefined;
}

/**
 * Assembles the head-to-head comparison from each library's payloads.
 *
 * @throws Error when the pivot library measured nothing.
 */
export function assembleTvComparison(
  payloadsByLibrary: ReadonlyMap<string, LibraryPayload>,
  options: AssembleTvComparisonOptions,
): TvComparison {
  const codefastPayload = payloadsByLibrary.get(CODEFAST_TV.libraryName);
  if (codefastPayload === undefined) {
    throw new Error(`No observations for the pivot library ${CODEFAST_TV.libraryName}.`);
  }
  const codefastLibrary = toLibrary(codefastPayload, CODEFAST_TV);
  const competitors = COMPETITORS.flatMap((library) => {
    const payload = payloadsByLibrary.get(library.libraryName);
    return payload === undefined ? [] : [toLibrary(payload, library)];
  });
  const markdown = renderComparisonMarkdownReport(codefastLibrary, competitors, {
    ...TAILWIND_VARIANTS_COMPARISON_MARKDOWN,
    runOrder: options.runOrder,
    baselineOf: SCENARIO_BASELINES,
  });
  const comparisonDocument = buildComparisonDocument(codefastLibrary, competitors, {
    runId: options.runId,
    runOrder: options.runOrder,
    scenariosAvailable: options.scenariosAvailable,
    shape: options.shape,
    baselineOf: SCENARIO_BASELINES,
  });
  return { codefastLibrary, competitors, markdown, comparisonDocument };
}
