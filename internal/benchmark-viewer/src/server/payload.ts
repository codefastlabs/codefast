import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { AggregatedScenarioResult, LibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import { buildLibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import type { JsonlBenchObservationRow } from "@codefast/benchmark-harness/report/jsonl";
import {
  isJsonlBenchObservationRow,
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "@codefast/benchmark-harness/report/jsonl";
import { OBSERVATIONS_FILE_NAME } from "@codefast/benchmark-harness/shared/env-keys";
import type { ScenarioTrialResult, TrialPayload } from "@codefast/benchmark-harness/shared/protocol";

import { DEFAULT_MAX_RUNS } from "#/constants";
import type {
  BenchServerOptions,
  ScenarioFacets,
  EmbeddedLibraryMeta,
  EmbeddedLibraryRunData,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/types";

// ── Run scanning ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One run directory's folder name and its raw JSONL observation lines.
 *
 * @since 0.3.16-canary.0
 */
export interface RunLines {
  readonly folderName: string;
  readonly lines: ReadonlyArray<string>;
}

/**
 * The raw runs read from the bench results directory, with overflow and warning info.
 *
 * @since 0.3.16-canary.0
 */
export interface ListRawRunsResult {
  readonly runs: ReadonlyArray<RunLines>;
  /** True when older directories exist beyond the maxRuns cap. */
  readonly hasMore: boolean;
  readonly warning: string | undefined;
}

async function readRunDirectory(runDirPath: string, folderName: string): Promise<RunLines | undefined> {
  const jsonlPath = join(runDirPath, OBSERVATIONS_FILE_NAME);
  let content: string;
  try {
    content = await readFile(jsonlPath, "utf8");
  } catch {
    return undefined;
  }
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return undefined;
  }
  return { folderName, lines };
}

/**
 * Reads the newest run directories' JSONL lines from the bench results directory, up to the run cap.
 *
 * @since 0.3.16-canary.0
 */
export async function listRawRuns(benchResultsDir: string, maxRuns?: number): Promise<ListRawRunsResult> {
  let entries: Array<Dirent>;
  try {
    entries = await readdir(benchResultsDir, { withFileTypes: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      runs: [],
      hasMore: false,
      warning: `Could not read bench results directory (${benchResultsDir}): ${detail}`,
    };
  }

  const dirNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted((left, right) => left.localeCompare(right));

  const totalDirs = dirNames.length;
  const cap = maxRuns ?? DEFAULT_MAX_RUNS;
  const hasMore = totalDirs > cap;
  const toRead = hasMore ? dirNames.slice(-cap) : dirNames;

  const results = await Promise.all(toRead.map((name) => readRunDirectory(join(benchResultsDir, name), name)));

  const runs = results.filter((run): run is RunLines => run !== undefined);
  return { runs, hasMore, warning: undefined };
}

// ── Payload building ─────────────────────────────────────────────────────────────────────────────────────────────────

interface SpreadResult {
  p25Hz: number;
  medianHz: number;
  p75Hz: number;
}

interface LibraryRunData {
  readonly report: LibraryReport;
  readonly spreads: Map<string, SpreadResult>;
}

interface RunData {
  readonly meta: EmbeddedRun;
  readonly reports: Map<string, LibraryReport>;
  readonly spreadsPerLib: Map<string, Map<string, SpreadResult>>;
  readonly scenarioIndices: Map<string, Map<string, AggregatedScenarioResult>>;
}

interface ParsedLines {
  observations: Array<JsonlBenchObservationRow>;
  skippedCount: number;
}

// Mutable accumulator for a single (scenario, library) series built across runs.
interface LibSeriesAccum {
  hz: Array<number | null>;
  p25: Array<number | null>;
  p75: Array<number | null>;
  iqrFraction: Array<number | null>;
}

function parseJsonlLines(lines: ReadonlyArray<string>): ParsedLines {
  const observations: Array<JsonlBenchObservationRow> = [];
  let skippedCount = 0;
  for (const line of lines) {
    try {
      const parsed: unknown = JSON.parse(line);
      if (isJsonlBenchObservationRow(parsed)) {
        observations.push(parsed);
      } else {
        skippedCount++;
      }
    } catch {
      skippedCount++;
    }
  }
  return { observations, skippedCount };
}

function buildLibraryRunData(libraryObservations: ReadonlyArray<JsonlBenchObservationRow>): LibraryRunData | undefined {
  const firstObservation = libraryObservations[0];
  if (firstObservation === undefined) {
    return undefined;
  }

  const fingerprint = jsonlBenchObservationRowToFingerprint(firstObservation);
  const byTrialIndex = new Map<number, Array<ScenarioTrialResult>>();

  for (const obs of libraryObservations) {
    const trialResult = jsonlBenchObservationRowToScenarioTrialResult(obs);
    const trialScenarios = byTrialIndex.get(obs.trialIndex);
    if (trialScenarios === undefined) {
      byTrialIndex.set(obs.trialIndex, [trialResult]);
    } else {
      trialScenarios.push(trialResult);
    }
  }

  const trialPayloads: Array<TrialPayload> = [...byTrialIndex.entries()]
    .toSorted((left, right) => left[0] - right[0])
    .map(([trialIndex, scenarios]) => ({ trialIndex, scenarios }));
  const report = buildLibraryReport(fingerprint, trialPayloads, []);

  // The aggregate rows already carry the per-trial spread, so the chart bands and the
  // report medians come from one derivation.
  const spreads = new Map<string, SpreadResult>();
  for (const row of report.scenarios) {
    spreads.set(row.id, { p25Hz: row.hzPerOpP25, medianHz: row.hzPerOpMedian, p75Hz: row.hzPerOpP75 });
  }

  return { report, spreads };
}

function extractRunMeta(
  folderName: string,
  observationsByLibrary: ReadonlyMap<string, ReadonlyArray<JsonlBenchObservationRow>>,
  libraryNames: ReadonlyArray<string>,
  canonicalLibraryKey: string,
): EmbeddedRun | undefined {
  const canonical = observationsByLibrary.get(canonicalLibraryKey)?.[0];
  if (canonical === undefined) {
    return undefined;
  }
  const envKey = `${canonical.cpuModel}|${canonical.nodeVersion}`;
  const envLabel = `${canonical.cpuModel} · Node ${canonical.nodeVersion}`;
  return {
    folder: folderName,
    envKey,
    envLabel,
    nodeVersion: canonical.nodeVersion,
    v8Version: canonical.v8Version,
    platform: canonical.platform,
    arch: canonical.arch,
    cpuModel: canonical.cpuModel,
    nodeOptions: canonical.nodeOptions,
    timestampIso: canonical.timestampIso,
    libraryVersions: libraryNames.flatMap((name) => {
      const obs = observationsByLibrary.get(name)?.[0];
      return obs !== undefined ? [{ key: name, version: obs.libraryVersion, gcExposed: obs.gcExposed }] : [];
    }),
  };
}

function hzLookup(index: ReadonlyMap<string, AggregatedScenarioResult>, scenarioId: string): number | null {
  const row = index.get(scenarioId);
  return row !== undefined && row.hzPerOpMedian > 0 ? row.hzPerOpMedian : null;
}

function hzIqrFractionLookup(index: ReadonlyMap<string, AggregatedScenarioResult>, scenarioId: string): number | null {
  const row = index.get(scenarioId);
  if (row === undefined || row.hzPerOpMedian <= 0) {
    return null;
  }
  const iqrFraction = row.hzPerOpIqrFraction;
  return Number.isFinite(iqrFraction) && iqrFraction > 0 ? iqrFraction : null;
}

/**
 * A scenario's declared facet labels, normalised to the declared chip order with unknown
 * labels dropped.
 *
 * @since 0.3.16-canary.3
 */
export function resolveScenarioFacets(scenarioId: string, facets: ScenarioFacets | undefined): Array<string> {
  const declared = facets?.byScenarioId[scenarioId];
  if (facets === undefined || declared === undefined || declared.length === 0) {
    return [];
  }
  return facets.labels.filter((label) => declared.includes(label));
}

/**
 * Builds the viewer payload from raw run lines: library metadata, run metadata, and per-scenario series.
 *
 * @since 0.3.16-canary.0
 */
export function buildEmbeddedPayload(
  rawRuns: ReadonlyArray<RunLines>,
  options: BenchServerOptions,
  hasMore: boolean,
  effectiveLimit: number,
  benchResultsWarning?: string,
): EmbeddedViewerPayload {
  const libraryNames = options.libraries.map((lib) => lib.name);
  const primaryName = options.libraries.find((lib) => lib.isPrimary)?.name ?? libraryNames[0] ?? "";

  const facetLabels = options.scenarioFacets?.labels ?? [];
  const viewDefaults = options.viewDefaults;

  if (libraryNames.length === 0) {
    return {
      title: options.title ?? "Benchmark history",
      primaryLibraryKey: "",
      libraries: [],
      runs: [],
      scenarios: [],
      facetLabels,
      ...(viewDefaults !== undefined && { viewDefaults }),
      generatedAtIso: new Date().toISOString(),
      effectiveLimit,
      hasMore,
      ...(benchResultsWarning !== undefined && { benchResultsWarning }),
    };
  }

  const runs: Array<RunData> = [];
  for (const raw of rawRuns) {
    const { observations, skippedCount } = parseJsonlLines(raw.lines);
    if (skippedCount > 0) {
      console.warn(`[bench-payload] ${raw.folderName}: skipped ${skippedCount} malformed JSONL line(s)`);
    }

    const libraryNameSet = new Set(libraryNames);
    const observationsByLibrary = new Map<string, Array<JsonlBenchObservationRow>>();
    for (const obs of observations) {
      if (!libraryNameSet.has(obs.libraryName)) {
        continue;
      }
      const list = observationsByLibrary.get(obs.libraryName);
      if (list === undefined) {
        observationsByLibrary.set(obs.libraryName, [obs]);
      } else {
        list.push(obs);
      }
    }

    const reports = new Map<string, LibraryReport>();
    const spreadsPerLib = new Map<string, Map<string, SpreadResult>>();

    for (const libName of libraryNames) {
      const libData = buildLibraryRunData(observationsByLibrary.get(libName) ?? []);
      if (libData !== undefined) {
        reports.set(libName, libData.report);
        spreadsPerLib.set(libName, libData.spreads);
      }
    }

    if (!reports.has(primaryName)) {
      console.warn(`[bench-payload] ${raw.folderName}: no rows for primary library "${primaryName}"; run not shown.`);
      continue;
    }

    const scenarioIndices = new Map<string, Map<string, AggregatedScenarioResult>>();
    for (const [libName, report] of reports) {
      const idx = new Map<string, AggregatedScenarioResult>();
      for (const row of report.scenarios) {
        idx.set(row.id, row);
      }
      scenarioIndices.set(libName, idx);
    }

    const meta = extractRunMeta(raw.folderName, observationsByLibrary, libraryNames, primaryName);
    if (meta !== undefined) {
      runs.push({ meta, reports, spreadsPerLib, scenarioIndices });
    }
  }

  // Collect scenario metadata newest run first: a row's group and description follow the suite's
  // current definition, not the one it had when the oldest saved run was recorded.
  const scenarioGroup = new Map<string, string>();
  const scenarioWhat = new Map<string, string>();
  for (const run of runs.toReversed()) {
    for (const [, report] of run.reports) {
      for (const scenario of report.scenarios) {
        if (!scenarioGroup.has(scenario.id)) {
          scenarioGroup.set(scenario.id, scenario.group);
        }
        if (scenario.what.length > 0 && !scenarioWhat.has(scenario.id)) {
          scenarioWhat.set(scenario.id, scenario.what);
        }
      }
    }
  }
  const scenarioIds = [...scenarioGroup.keys()].toSorted((left, right) => {
    const groupCompare = (scenarioGroup.get(left) ?? "").localeCompare(scenarioGroup.get(right) ?? "");
    return groupCompare !== 0 ? groupCompare : left.localeCompare(right);
  });

  const embeddedRuns: Array<EmbeddedRun> = runs.map((run) => run.meta);

  // Pre-allocate series accumulators keyed by scenarioId → libName.
  const seriesAccum = new Map<string, Map<string, LibSeriesAccum>>();
  for (const scenarioId of scenarioIds) {
    const perLib = new Map<string, LibSeriesAccum>();
    for (const libName of libraryNames) {
      perLib.set(libName, { hz: [], p25: [], p75: [], iqrFraction: [] });
    }
    seriesAccum.set(scenarioId, perLib);
  }

  // Fill arrays in (run → lib → scenario) order so the outer Map lookups for
  // scenarioIndices and spreadsPerLib are amortised across all scenarios per run.
  for (const run of runs) {
    for (const libName of libraryNames) {
      const libIndex = run.scenarioIndices.get(libName);
      const libSpreads = run.spreadsPerLib.get(libName);
      for (const scenarioId of scenarioIds) {
        const accum = seriesAccum.get(scenarioId)!.get(libName)!;
        accum.hz.push(libIndex !== undefined ? hzLookup(libIndex, scenarioId) : null);
        accum.iqrFraction.push(libIndex !== undefined ? hzIqrFractionLookup(libIndex, scenarioId) : null);
        const spread = libSpreads?.get(scenarioId);
        accum.p25.push(spread !== undefined && spread.p25Hz > 0 ? spread.p25Hz : null);
        accum.p75.push(spread !== undefined && spread.p75Hz > 0 ? spread.p75Hz : null);
      }
    }
  }

  const scenarios: Array<EmbeddedScenarioSeries> = scenarioIds.map((scenarioId) => {
    const libraryData: Record<string, EmbeddedLibraryRunData> = {};
    const perLib = seriesAccum.get(scenarioId)!;
    for (const libName of libraryNames) {
      libraryData[libName] = perLib.get(libName)! as EmbeddedLibraryRunData;
    }
    return {
      id: scenarioId,
      group: scenarioGroup.get(scenarioId) ?? "unknown",
      what: scenarioWhat.get(scenarioId) ?? "",
      facets: resolveScenarioFacets(scenarioId, options.scenarioFacets),
      libraries: libraryData,
    };
  });

  const libraries: Array<EmbeddedLibraryMeta> = options.libraries.map((lib) => ({
    key: lib.name,
    displayName: lib.displayName ?? lib.name,
    isPrimary: lib.isPrimary ?? false,
  }));

  return {
    title: options.title ?? "Benchmark history",
    primaryLibraryKey: primaryName,
    libraries,
    runs: embeddedRuns,
    scenarios,
    facetLabels,
    ...(viewDefaults !== undefined && { viewDefaults }),
    generatedAtIso: new Date().toISOString(),
    effectiveLimit,
    hasMore,
    ...(benchResultsWarning !== undefined && { benchResultsWarning }),
  };
}
