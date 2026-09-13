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

import { CODEFAST_DI, COMPETITORS } from "#/harness/config";
import type { DiBenchLibrary } from "#/harness/config";
import { DI_COMPARISON_MARKDOWN } from "#/harness/presentation";

/** One library's fingerprint and per-trial payloads, live from a run or reconstructed from disk. */
export interface LibraryPayload {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
  readonly sanityFailures?: ReadonlyArray<string> | undefined;
}

function toLibrary(payload: LibraryPayload, library: DiBenchLibrary): ComparisonLibrary {
  const report: LibraryReport = buildLibraryReport(payload.fingerprint, payload.trials, payload.sanityFailures ?? []);
  return { report, displayName: resolveDisplayName(library), shortName: library.shortName };
}

/** The assembled comparison: the pivot, its competitors, the markdown report, and the document. */
export interface DiComparison {
  readonly codefastLibrary: ComparisonLibrary;
  readonly competitors: ReadonlyArray<ComparisonLibrary>;
  readonly markdown: string;
  readonly comparisonDocument: ComparisonDocument;
}

/** Inputs a comparison needs beyond the payloads: the run id, its order caveat, and its shape. */
export interface AssembleDiComparisonOptions {
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
export function assembleDiComparison(
  payloadsByLibrary: ReadonlyMap<string, LibraryPayload>,
  options: AssembleDiComparisonOptions,
): DiComparison {
  const codefastPayload = payloadsByLibrary.get(CODEFAST_DI.libraryName);
  if (codefastPayload === undefined) {
    throw new Error(`No observations for the pivot library ${CODEFAST_DI.libraryName}.`);
  }
  const codefastLibrary = toLibrary(codefastPayload, CODEFAST_DI);
  const competitors = COMPETITORS.flatMap((library) => {
    const payload = payloadsByLibrary.get(library.libraryName);
    return payload === undefined ? [] : [toLibrary(payload, library)];
  });
  const markdown = renderComparisonMarkdownReport(codefastLibrary, competitors, {
    ...DI_COMPARISON_MARKDOWN,
    runOrder: options.runOrder,
  });
  const comparisonDocument = buildComparisonDocument(codefastLibrary, competitors, {
    runId: options.runId,
    runOrder: options.runOrder,
    scenariosAvailable: options.scenariosAvailable,
    shape: options.shape,
  });
  return { codefastLibrary, competitors, markdown, comparisonDocument };
}
