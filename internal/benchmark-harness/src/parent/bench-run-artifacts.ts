import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";

import type { ComparisonDocument } from "#report/comparison-document";
import { benchConfigKey } from "#report/jsonl";
import { writeJsonFile, writeJsonlRun } from "#report/write";
import type { BenchRunConfiguration } from "#shared/env-keys";
import { BENCH_RESULTS_DIR_NAME, LATEST_RUN_POINTER_FILE_NAME, OBSERVATIONS_FILE_NAME } from "#shared/env-keys";
import type { Fingerprint, TrialPayload } from "#shared/protocol";

/**
 * Where one run's single artifact goes: a timestamped directory holding `observations.jsonl`, plus
 * the `latest.json` pointers, one per run configuration, the newest whole-suite run updates.
 *
 * @since 0.6.0
 */
export interface BenchRunOutputPaths {
  /** Run-directory basename, written into `latest.json` so its configuration's pointer names this run exactly. */
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
 *
 * @since 0.9.0
 */
export interface BenchRunArtifactsResult {
  readonly latestPointer: "moved" | "kept-filtered" | "kept-empty";
}

/**
 * Writes a run's `observations.jsonl` and, for a whole-suite run, points its configuration's pointer at it.
 *
 * @remarks Only a whole-suite run moves a pointer, and only its own configuration's: a pointer has to
 * mean the complete suite as that configuration measures it. Nothing is printed; the caller states
 * the outcome in its run card.
 *
 * @since 0.6.0
 */
export function writeBenchRunArtifacts(parameters: WriteBenchRunArtifactsParameters): BenchRunArtifactsResult {
  const { paths, comparisonDocument, librariesForJsonl } = parameters;

  writeJsonlRun(paths.jsonlPath, librariesForJsonl);

  const { scenarioFilter, scenarioTier, libraryFilter, scenariosMeasured } = comparisonDocument.run;
  if (scenarioFilter !== null || scenarioTier !== null || libraryFilter !== null) {
    return { latestPointer: "kept-filtered" };
  }
  // A run whose subject measured nothing (every row errored or failed sanity) is not the suite either.
  if (scenariosMeasured === 0) {
    return { latestPointer: "kept-empty" };
  }

  const pointers = readLatestPointers(paths.latestPointerPath);
  pointers.set(benchConfigKey(comparisonDocument.run), paths.runId);
  const sorted = [...pointers].toSorted(([left], [right]) => left.localeCompare(right));
  writeJsonFile(paths.latestPointerPath, Object.fromEntries(sorted.map(([key, runId]) => [key, { runId }])));
  return { latestPointer: "moved" };
}

/**
 * A run directory holding an `observations.jsonl`, paired with the run id it was written under.
 *
 * @since 0.9.0
 */
export interface ResolvedRunDirectory {
  readonly runId: string;
  readonly runDirectory: string;
}

function hasObservations(runDirectory: string): boolean {
  return existsSync(join(runDirectory, OBSERVATIONS_FILE_NAME));
}

// Each configuration key maps to `{ runId }`; an entry of any other shape, or an unreadable file, reads as absent.
function readLatestPointers(pointerPath: string): Map<string, string> {
  const pointers = new Map<string, string>();
  if (!existsSync(pointerPath)) {
    return pointers;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(pointerPath, "utf8"));
  } catch {
    return pointers;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return pointers;
  }
  for (const [key, entry] of Object.entries(parsed)) {
    if (typeof entry === "object" && entry !== null && typeof (entry as { runId?: unknown }).runId === "string") {
      pointers.set(key, (entry as { runId: string }).runId);
    }
  }
  return pointers;
}

// Run ids are fixed-width ISO stamps, so the lexicographically last run directory is the most recent.
function newestRunDirName(runsDirectory: string): string | undefined {
  if (!existsSync(runsDirectory)) {
    return undefined;
  }
  return readdirSync(runsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => hasObservations(join(runsDirectory, name)))
    .toSorted((left, right) => left.localeCompare(right))
    .at(-1);
}

/**
 * Resolves which run directory a report should read: an explicit path or run id when given,
 * otherwise the newest run any `latest.json` pointer names, otherwise the newest directory on disk.
 *
 * @param packageRootDirectory - The benchmark package root; `bench-results/` is resolved under it.
 * @param requested - A run directory, a directory of runs (its newest member is read), a run id,
 * `"latest"`, or omitted for the newest run.
 *
 * @since 0.9.0
 */
export function resolveRunDirectory(packageRootDirectory: string, requested?: string): ResolvedRunDirectory {
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  if (requested !== undefined && requested.length > 0 && requested !== "latest") {
    const asPath = isAbsolute(requested) ? requested : resolve(packageRootDirectory, requested);
    if (hasObservations(asPath)) {
      return { runId: basename(asPath), runDirectory: asPath };
    }
    // A directory of runs — a suite's committed `baselines/`, say — resolves to its newest member.
    const newestInDirectory = newestRunDirName(asPath);
    if (newestInDirectory !== undefined) {
      return { runId: newestInDirectory, runDirectory: join(asPath, newestInDirectory) };
    }
    const asRunId = join(benchResultsRoot, requested);
    if (hasObservations(asRunId)) {
      return { runId: requested, runDirectory: asRunId };
    }
    throw new Error(`No ${OBSERVATIONS_FILE_NAME} found for "${requested}".`);
  }
  const pointerRunId = [...readLatestPointers(join(benchResultsRoot, LATEST_RUN_POINTER_FILE_NAME)).values()]
    .filter((runId) => hasObservations(join(benchResultsRoot, runId)))
    .toSorted((left, right) => left.localeCompare(right))
    .at(-1);
  if (pointerRunId !== undefined) {
    return { runId: pointerRunId, runDirectory: join(benchResultsRoot, pointerRunId) };
  }
  const newestRunId = newestRunDirName(benchResultsRoot);
  if (newestRunId === undefined) {
    throw new Error(`No runs found in ${benchResultsRoot}.`);
  }
  return { runId: newestRunId, runDirectory: join(benchResultsRoot, newestRunId) };
}

/**
 * Resolves the newest whole-suite run measured under one configuration, from its `latest.json` pointer.
 *
 * @remarks A missing pointer, or one naming a run that is gone, reads as no run: the newest directory
 * could be a narrowed run or another configuration, which is exactly what a diff must not read.
 */
export function resolveLatestRunDirectory(
  packageRootDirectory: string,
  configuration: BenchRunConfiguration,
): ResolvedRunDirectory | undefined {
  const benchResultsRoot = join(packageRootDirectory, BENCH_RESULTS_DIR_NAME);
  const runId = readLatestPointers(join(benchResultsRoot, LATEST_RUN_POINTER_FILE_NAME)).get(
    benchConfigKey(configuration),
  );
  if (runId === undefined || !hasObservations(join(benchResultsRoot, runId))) {
    return undefined;
  }
  return { runId, runDirectory: join(benchResultsRoot, runId) };
}

/**
 * Reads a run directory's `observations.jsonl` content.
 *
 * @since 0.9.0
 */
export function readRunObservations(runDirectory: string): string {
  return readFileSync(join(runDirectory, OBSERVATIONS_FILE_NAME), "utf8");
}
