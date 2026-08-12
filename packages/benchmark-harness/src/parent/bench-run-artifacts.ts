import { join } from "node:path";

import type { ComparisonDocument } from "#/report/comparison-document";
import { writeJsonFile, writeJsonlRun, writeMarkdownFile } from "#/report/write";
import { BENCH_RESULTS_DIR_NAME, OBSERVATIONS_FILE_NAME } from "#/shared/env-keys";
import type { Fingerprint, TrialPayload } from "#/shared/protocol";

/**
 * Where one run's artifacts go: a timestamped directory, mirrored to stable `latest.*` names.
 */
export interface BenchRunOutputPaths {
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
 */
export function buildBenchRunOutputPaths(packageRootDirectory: string): BenchRunOutputPaths {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, timestamp);
  return {
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
 */
export function writeBenchRunArtifacts(parameters: WriteBenchRunArtifactsParameters): void {
  const { paths, markdown, comparisonDocument, librariesForJsonl } = parameters;

  writeMarkdownFile(paths.markdownPath, markdown);
  writeJsonFile(paths.jsonPath, comparisonDocument);
  writeJsonlRun(paths.jsonlPath, librariesForJsonl);

  writeMarkdownFile(paths.latestMarkdownPath, markdown);
  writeJsonFile(paths.latestJsonPath, comparisonDocument);
  writeJsonlRun(paths.latestJsonlPath, librariesForJsonl);

  console.log(`\nRun directory: ${paths.runDirectory}`);
  console.log(`  report.md   ${paths.markdownPath}`);
  console.log(`  report.json ${paths.jsonPath}`);
  console.log(`  ${OBSERVATIONS_FILE_NAME} ${paths.jsonlPath}`);
  console.log(`Mirrored to ${paths.latestMarkdownPath}, ${paths.latestJsonPath}, ${paths.latestJsonlPath}`);
}
