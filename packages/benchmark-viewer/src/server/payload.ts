import { readdirSync, readFileSync } from "node:fs";
import type { Dirent } from "node:fs";
import { join } from "node:path";
import type {
  ScenarioTrialResult,
  TrialPayload,
} from "@codefast/benchmark-harness/shared/protocol";
import type { JsonlBenchObservationRow } from "@codefast/benchmark-harness/report/jsonl";
import {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "@codefast/benchmark-harness/report/jsonl";
import type {
  AggregatedScenarioResult,
  LibraryReport,
} from "@codefast/benchmark-harness/report/aggregate";
import { buildLibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import { quantile, sortAscending } from "@codefast/benchmark-harness/report/quantiles";
import { OBSERVATIONS_FILE_NAME } from "@codefast/benchmark-harness/shared/env-keys";
import type {
  BenchServerOptions,
  EmbeddedLibraryMeta,
  EmbeddedLibraryRunData,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/types";

// ---------------------------------------------------------------------------
// Run scanning
// ---------------------------------------------------------------------------

/**
 * @since 0.3.16-canary.0
 */
export interface RunLines {
  readonly folderName: string;
  readonly lines: ReadonlyArray<string>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ListRawRunsResult {
  readonly runs: ReadonlyArray<RunLines>;
  readonly warning: string | undefined;
}

function readRunDirectory(runDirPath: string, folderName: string): RunLines | undefined {
  const jsonlPath = join(runDirPath, OBSERVATIONS_FILE_NAME);
  let content: string;
  try {
    content = readFileSync(jsonlPath, "utf8");
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
 * @since 0.3.16-canary.0
 */
export function listRawRuns(benchResultsDir: string): ListRawRunsResult {
  let entries: Array<Dirent<string>>;
  try {
    entries = readdirSync(benchResultsDir, { withFileTypes: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      runs: [],
      warning: `Could not read bench results directory (${benchResultsDir}): ${detail}`,
    };
  }
  const runs: Array<RunLines> = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const run = readRunDirectory(join(benchResultsDir, entry.name), entry.name);
    if (run !== undefined) {
      runs.push(run);
    }
  }
  runs.sort((left, right) => left.folderName.localeCompare(right.folderName));
  return { runs, warning: undefined };
}

// ---------------------------------------------------------------------------
// Payload building
// ---------------------------------------------------------------------------

interface SpreadResult {
  p25Hz: number;
  medianHz: number;
  p75Hz: number;
}

interface LibraryRunData {
  readonly report: LibraryReport;
  readonly spreads: Map<string, SpreadResult | null>;
}

interface RunData {
  readonly meta: EmbeddedRun;
  readonly reports: Map<string, LibraryReport>;
  readonly spreadsPerLib: Map<string, Map<string, SpreadResult | null>>;
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
      observations.push(JSON.parse(line) as JsonlBenchObservationRow);
    } catch {
      skippedCount++;
    }
  }
  return { observations, skippedCount };
}

function buildLibraryRunData(
  observations: ReadonlyArray<JsonlBenchObservationRow>,
  libraryName: string,
): LibraryRunData | undefined {
  const libraryObservations = observations.filter(
    (observation) => observation.libraryName === libraryName,
  );
  if (libraryObservations.length === 0) {
    return undefined;
  }

  const fingerprint = jsonlBenchObservationRowToFingerprint(libraryObservations[0]!);
  const byTrialIndex = new Map<number, Array<ScenarioTrialResult>>();
  const trialHzByScenario = new Map<string, Map<number, number>>();

  for (const obs of libraryObservations) {
    const trialResult = jsonlBenchObservationRowToScenarioTrialResult(obs);
    const trialScenarios = byTrialIndex.get(obs.trialIndex);
    if (trialScenarios === undefined) {
      byTrialIndex.set(obs.trialIndex, [trialResult]);
    } else {
      trialScenarios.push(trialResult);
    }
    if (obs.samples > 0) {
      let scenarioTrials = trialHzByScenario.get(obs.scenarioId);
      if (scenarioTrials === undefined) {
        scenarioTrials = new Map();
        trialHzByScenario.set(obs.scenarioId, scenarioTrials);
      }
      scenarioTrials.set(obs.trialIndex, obs.hzPerOp);
    }
  }

  const trialPayloads: Array<TrialPayload> = [...byTrialIndex.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([trialIndex, scenarios]) => ({ trialIndex, scenarios }));
  const report = buildLibraryReport(fingerprint, trialPayloads, []);

  const spreads = new Map<string, SpreadResult | null>();
  for (const [scenarioId, trialHz] of trialHzByScenario) {
    const sorted = sortAscending([...trialHz.values()]);
    spreads.set(
      scenarioId,
      sorted.length === 0
        ? null
        : {
            p25Hz: quantile(sorted, 0.25),
            medianHz: quantile(sorted, 0.5),
            p75Hz: quantile(sorted, 0.75),
          },
    );
  }

  return { report, spreads };
}

function extractRunMeta(
  folderName: string,
  observations: ReadonlyArray<JsonlBenchObservationRow>,
  libraryNames: ReadonlyArray<string>,
  canonicalLibraryKey: string,
): EmbeddedRun | undefined {
  const libraryNameSet = new Set(libraryNames);
  const firstObsByLibrary = new Map<string, JsonlBenchObservationRow>();
  for (const obs of observations) {
    if (!firstObsByLibrary.has(obs.libraryName) && libraryNameSet.has(obs.libraryName)) {
      firstObsByLibrary.set(obs.libraryName, obs);
    }
    if (firstObsByLibrary.size === libraryNames.length) {
      break;
    }
  }
  const canonical = firstObsByLibrary.get(canonicalLibraryKey);
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
      const obs = firstObsByLibrary.get(name);
      return obs !== undefined
        ? [{ key: name, version: obs.libraryVersion, gcExposed: obs.gcExposed }]
        : [];
    }),
  };
}

function hzLookup(
  index: ReadonlyMap<string, AggregatedScenarioResult>,
  scenarioId: string,
): number | null {
  const row = index.get(scenarioId);
  return row !== undefined && row.hzPerOpMedian > 0 ? row.hzPerOpMedian : null;
}

function hzIqrFractionLookup(
  index: ReadonlyMap<string, AggregatedScenarioResult>,
  scenarioId: string,
): number | null {
  const row = index.get(scenarioId);
  if (row === undefined || row.hzPerOpMedian <= 0) {
    return null;
  }
  const iqrFraction = row.hzPerOpIqrFraction;
  return Number.isFinite(iqrFraction) && iqrFraction > 0 ? iqrFraction : null;
}

/**
 * @since 0.3.16-canary.0
 */
export function buildEmbeddedPayload(
  rawRuns: ReadonlyArray<RunLines>,
  options: BenchServerOptions,
  benchResultsWarning?: string,
): EmbeddedViewerPayload {
  const libraryNames = options.libraries.map((lib) => lib.name);
  const primaryName = options.libraries.find((lib) => lib.isPrimary)?.name ?? libraryNames[0] ?? "";

  if (libraryNames.length === 0) {
    return {
      title: options.title ?? "Benchmark history",
      primaryLibraryKey: "",
      libraries: [],
      runs: [],
      scenarios: [],
      generatedAtIso: new Date().toISOString(),
      ...(benchResultsWarning !== undefined && { benchResultsWarning }),
    };
  }

  const runs: Array<RunData> = [];
  for (const raw of rawRuns) {
    const { observations, skippedCount } = parseJsonlLines(raw.lines);
    if (skippedCount > 0) {
      console.warn(
        `[bench-payload] ${raw.folderName}: skipped ${skippedCount} malformed JSONL line(s)`,
      );
    }

    const reports = new Map<string, LibraryReport>();
    const spreadsPerLib = new Map<string, Map<string, SpreadResult | null>>();

    for (const libName of libraryNames) {
      const libData = buildLibraryRunData(observations, libName);
      if (libData !== undefined) {
        reports.set(libName, libData.report);
        spreadsPerLib.set(libName, libData.spreads);
      }
    }

    if (!reports.has(primaryName)) {
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

    const meta = extractRunMeta(raw.folderName, observations, libraryNames, primaryName);
    if (meta !== undefined) {
      runs.push({ meta, reports, spreadsPerLib, scenarioIndices });
    }
  }

  // Collect scenario metadata in forward order so the oldest run's values take precedence.
  const scenarioGroup = new Map<string, string>();
  const scenarioWhat = new Map<string, string>();
  for (const run of runs) {
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
  const scenarioIds = [...scenarioGroup.keys()].sort((left, right) => {
    const groupCompare = (scenarioGroup.get(left) ?? "").localeCompare(
      scenarioGroup.get(right) ?? "",
    );
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
        accum.iqrFraction.push(
          libIndex !== undefined ? hzIqrFractionLookup(libIndex, scenarioId) : null,
        );
        const spread = libSpreads?.get(scenarioId) ?? null;
        accum.p25.push(spread !== null && spread.p25Hz > 0 ? spread.p25Hz : null);
        accum.p75.push(spread !== null && spread.p75Hz > 0 ? spread.p75Hz : null);
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
    generatedAtIso: new Date().toISOString(),
    ...(benchResultsWarning !== undefined && { benchResultsWarning }),
  };
}
