import { join } from "node:path";

import type { ComparisonDocument } from "#/report/comparison-document";
import { writeJsonFile, writeJsonlRun, writeMarkdownFile } from "#/report/write";
import { BENCH_RESULTS_DIR_NAME, OBSERVATIONS_FILE_NAME } from "#/shared/env-keys";
import type { Fingerprint, TrialPayload } from "#/shared/protocol";

/**
 * Where one run's artifacts go: a timestamped directory, mirrored to stable `latest.*` names.
 *
 * @since 0.6.0
 */
export interface BenchRunOutputPaths {
  /** Run-directory basename, carried into the document so a `latest.*` mirror joins back exactly. */
  readonly runId: string;
  readonly runDirectory: string;
  readonly markdownPath: string;
  readonly jsonPath: string;
  readonly jsonlPath: string;
  readonly latestMarkdownPath: string;
  readonly latestJsonPath: string;
  readonly latestJsonlPath: string;
}

/**
 * Builds the output paths for a run starting now.
 *
 * @remarks Every run is date-stamped so historical comparisons are never clobbered; the `latest.*`
 * mirror gives CI and cross-run tooling a stable filename to diff against.
 *
 * @since 0.6.0
 */
export function buildBenchRunOutputPaths(packageRootDirectory: string): BenchRunOutputPaths {
  // One stamp for the directory name and the document, so the two cannot disagree — the fingerprint's
  // own timestamp comes from a child and lands a second or so earlier.
  const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, runId);
  return {
    runId,
    runDirectory,
    markdownPath: join(runDirectory, "report.md"),
    jsonPath: join(runDirectory, "report.json"),
    jsonlPath: join(runDirectory, OBSERVATIONS_FILE_NAME),
    latestMarkdownPath: join(benchResultsRoot, "latest.md"),
    latestJsonPath: join(benchResultsRoot, "latest.json"),
    latestJsonlPath: join(benchResultsRoot, "latest.jsonl"),
  };
}

/**
 * @remarks `comparisonDocument` is the same comparison `markdown` renders — the markdown rounds every
 * ratio and spends its reliability verdicts as glyphs, so it does not read back.
 *
 * @since 0.6.0
 */
export interface WriteBenchRunArtifactsParameters {
  readonly paths: BenchRunOutputPaths;
  readonly markdown: string;
  readonly comparisonDocument: ComparisonDocument;
  readonly librariesForJsonl: ReadonlyArray<{
    fingerprint: Fingerprint;
    trials: ReadonlyArray<TrialPayload>;
  }>;
}

/**
 * Writes a run's three artifacts into its directory, mirrors them to `latest.*`, and names them on
 * stdout.
 *
 * @remarks A narrowed run does not mirror. `latest.*` is what CI diffs and what a published figure is
 * checked against, so it has to mean the whole suite — a run filtered to a row or two would overwrite
 * it with something that looks complete and is not.
 *
 * @since 0.6.0
 */
export function writeBenchRunArtifacts(parameters: WriteBenchRunArtifactsParameters): void {
  const { paths, markdown, comparisonDocument, librariesForJsonl } = parameters;

  writeMarkdownFile(paths.markdownPath, markdown);
  writeJsonFile(paths.jsonPath, comparisonDocument);
  writeJsonlRun(paths.jsonlPath, librariesForJsonl);

  console.log(`\nRun directory: ${paths.runDirectory}`);
  console.log(`  report.md   ${paths.markdownPath}`);
  console.log(`  report.json ${paths.jsonPath}`);
  console.log(`  ${OBSERVATIONS_FILE_NAME} ${paths.jsonlPath}`);

  const { scenarioFilter, mode, scenariosMeasured, scenariosAvailable } = comparisonDocument.run;
  if (scenarioFilter !== null) {
    console.log(
      `Not mirrored to latest.*: filtered to ${String(scenariosMeasured)} of ${String(scenariosAvailable)} rows ` +
        `(${scenarioFilter.join(", ")}). Run the whole suite to move latest.*.`,
    );
    return;
  }

  writeMarkdownFile(paths.latestMarkdownPath, markdown);
  writeJsonFile(paths.latestJsonPath, comparisonDocument);
  writeJsonlRun(paths.latestJsonlPath, librariesForJsonl);
  console.log(`Mirrored to latest.* (${mode} profile, ${String(scenariosMeasured)} rows)`);
}
