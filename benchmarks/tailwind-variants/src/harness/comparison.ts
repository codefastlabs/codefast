/** The head-to-head comparison assembled from each library's payloads, shared by the run and report entries. */
import { buildLibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import type { LibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import type { ComparisonLibrary } from "@codefast/benchmark-harness/report/comparison";
import { renderComparisonMarkdownReport } from "@codefast/benchmark-harness/report/comparison";
import { buildComparisonDocument } from "@codefast/benchmark-harness/report/comparison-document";
import type { ComparisonDocument } from "@codefast/benchmark-harness/report/comparison-document";
import { resolveDisplayName } from "@codefast/benchmark-harness/shared/config";
import type { BenchRunShape } from "@codefast/benchmark-harness/shared/env-keys";
import type { Fingerprint, TrialPayload } from "@codefast/benchmark-harness/shared/protocol";

import { SCENARIO_BASELINES } from "#/fixtures/scenario-parity";
import { CODEFAST_TV, CVA, TAILWIND_VARIANTS } from "#/harness/config";
import { TAILWIND_VARIANTS_COMPARISON_MARKDOWN } from "#/harness/presentation";

/** One library's fingerprint and per-trial payloads, live from a run or reconstructed from disk. */
export interface LibraryPayload {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
  readonly sanityFailures?: ReadonlyArray<string> | undefined;
}

interface CompetitorSpec {
  readonly libraryName: string;
  readonly displayName: string;
  readonly shortName: string;
}

// Order fixes the report columns: tailwind-variants then class-variance-authority.
const COMPETITOR_SPECS: ReadonlyArray<CompetitorSpec> = [
  { libraryName: TAILWIND_VARIANTS.libraryName, displayName: resolveDisplayName(TAILWIND_VARIANTS), shortName: "tv" },
  { libraryName: CVA.libraryName, displayName: resolveDisplayName(CVA), shortName: "cva" },
];

function toLibrary(payload: LibraryPayload, displayName: string, shortName: string): ComparisonLibrary {
  const report: LibraryReport = buildLibraryReport(payload.fingerprint, payload.trials, payload.sanityFailures ?? []);
  return { report, displayName, shortName };
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
  const codefastLibrary = toLibrary(codefastPayload, resolveDisplayName(CODEFAST_TV), "cf");
  const competitors = COMPETITOR_SPECS.flatMap((spec) => {
    const payload = payloadsByLibrary.get(spec.libraryName);
    return payload === undefined ? [] : [toLibrary(payload, spec.displayName, spec.shortName)];
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
