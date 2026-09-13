import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";

import type { ComparisonDocument } from "#/report/comparison-document";
import { writeJsonFile, writeJsonlRun } from "#/report/write";
import { BENCH_RESULTS_DIR_NAME, LATEST_RUN_POINTER_FILE_NAME, OBSERVATIONS_FILE_NAME } from "#/shared/env-keys";
import type { Fingerprint, TrialPayload } from "#/shared/protocol";

/**
 * Where one run's single artifact goes: a timestamped directory holding `observations.jsonl`, plus
 * the `latest.json` pointer the newest whole-suite run updates.
 *
 * @since 0.6.0
 */
export interface BenchRunOutputPaths {
  /** Run-directory basename, written into `latest.json` so the pointer names this run exactly. */
  readonly runId: string;
  readonly runDirectory: string;
  readonly jsonlPath: string;
  readonly latestPointerPath: string;
}

/**
 * Builds the output paths for a run starting now.
 *
 * @remarks Every run is date-stamped so history is never clobbered; the report and the comparison
 * document are not written here — they are derived on demand from the observations a run persists.
 *
 * @since 0.6.0
 */
export function buildBenchRunOutputPaths(packageRootDirectory: string): BenchRunOutputPaths {
  const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runDirectory = join(benchResultsRoot, runId);
  return {
    runId,
    runDirectory,
    jsonlPath: join(runDirectory, OBSERVATIONS_FILE_NAME),
    latestPointerPath: join(benchResultsRoot, LATEST_RUN_POINTER_FILE_NAME),
  };
}

/**
 * @remarks `comparisonDocument` is not written; only its `run` block decides whether this run is the
 * whole suite and may move `latest.json`.
 *
 * @since 0.6.0
 */
export interface WriteBenchRunArtifactsParameters {
  readonly paths: BenchRunOutputPaths;
  readonly comparisonDocument: ComparisonDocument;
  readonly librariesForJsonl: ReadonlyArray<{
    fingerprint: Fingerprint;
    trials: ReadonlyArray<TrialPayload>;
  }>;
}

/**
 * What happened to `latest.json`: moved to this run, or kept because the run was not the whole suite.
 */
export interface BenchRunArtifactsResult {
  readonly latestPointer: "moved" | "kept-filtered" | "kept-empty";
}

/**
 * Writes a run's `observations.jsonl` and points `latest.json` at it when it is the whole suite.
 *
 * @remarks Only a whole-suite run moves the pointer: `latest.json` has to mean the complete suite, so
 * a run filtered to a row or two — or one that measured nothing — leaves it untouched. Nothing is
 * printed; the caller states the outcome in its run card.
 *
 * @since 0.6.0
 */
export function writeBenchRunArtifacts(parameters: WriteBenchRunArtifactsParameters): BenchRunArtifactsResult {
  const { paths, comparisonDocument, librariesForJsonl } = parameters;

  writeJsonlRun(paths.jsonlPath, librariesForJsonl);

  const { scenarioFilter, scenariosMeasured } = comparisonDocument.run;
  if (scenarioFilter !== null) {
    return { latestPointer: "kept-filtered" };
  }
  // A run whose subject measured nothing (every row errored or failed sanity) is not the suite either.
  if (scenariosMeasured === 0) {
    return { latestPointer: "kept-empty" };
  }

  writeJsonFile(paths.latestPointerPath, { runId: paths.runId });
  return { latestPointer: "moved" };
}

/**
 * A run directory holding an `observations.jsonl`, paired with the run id it was written under.
 */
export interface ResolvedRunDirectory {
  readonly runId: string;
  readonly runDirectory: string;
}

function hasObservations(runDirectory: string): boolean {
  return existsSync(join(runDirectory, OBSERVATIONS_FILE_NAME));
}

function readLatestPointerRunId(benchResultsRoot: string): string | undefined {
  const pointerPath = join(benchResultsRoot, LATEST_RUN_POINTER_FILE_NAME);
  if (!existsSync(pointerPath)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(pointerPath, "utf8"));
    if (typeof parsed === "object" && parsed !== null && typeof (parsed as { runId?: unknown }).runId === "string") {
      return (parsed as { runId: string }).runId;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function newestRunDirName(benchResultsRoot: string): string | undefined {
  if (!existsSync(benchResultsRoot)) {
    return undefined;
  }
  return readdirSync(benchResultsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => hasObservations(join(benchResultsRoot, name)))
    .toSorted((left, right) => left.localeCompare(right))
    .at(-1);
}

/**
 * Resolves which run directory a report should read: an explicit path or run id when given,
 * otherwise the run the `latest.json` pointer names, otherwise the newest directory on disk.
 *
 * @param packageRootDirectory - The benchmark package root; `bench-results/` is resolved under it.
 * @param requested - A run directory path, a run id, `"latest"`, or omitted for the newest run.
 */
export function resolveRunDirectory(packageRootDirectory: string, requested?: string): ResolvedRunDirectory {
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  if (requested !== undefined && requested.length > 0 && requested !== "latest") {
    const asPath = isAbsolute(requested) ? requested : resolve(packageRootDirectory, requested);
    if (hasObservations(asPath)) {
      return { runId: basename(asPath), runDirectory: asPath };
    }
    const asRunId = join(benchResultsRoot, requested);
    if (hasObservations(asRunId)) {
      return { runId: requested, runDirectory: asRunId };
    }
    throw new Error(`No ${OBSERVATIONS_FILE_NAME} found for "${requested}".`);
  }
  const pointerRunId = readLatestPointerRunId(benchResultsRoot);
  if (pointerRunId !== undefined && hasObservations(join(benchResultsRoot, pointerRunId))) {
    return { runId: pointerRunId, runDirectory: join(benchResultsRoot, pointerRunId) };
  }
  const newestRunId = newestRunDirName(benchResultsRoot);
  if (newestRunId === undefined) {
    throw new Error(`No runs found in ${benchResultsRoot}.`);
  }
  return { runId: newestRunId, runDirectory: join(benchResultsRoot, newestRunId) };
}

/**
 * Reads a run directory's `observations.jsonl` content.
 */
export function readRunObservations(runDirectory: string): string {
  return readFileSync(join(runDirectory, OBSERVATIONS_FILE_NAME), "utf8");
}
