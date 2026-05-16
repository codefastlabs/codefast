import type {
  ScenarioTrialResult,
  TrialPayload,
} from "@codefast/benchmark-harness/shared/protocol";
import type { JsonlBenchObservationRow } from "@codefast/benchmark-harness/report/jsonl";
import {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "@codefast/benchmark-harness/report/jsonl";
import type { LibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import { buildLibraryReport } from "@codefast/benchmark-harness/report/aggregate";
import { quantile, sortAscending } from "@codefast/benchmark-harness/report/quantiles";
import type {
  BenchServerOptions,
  EmbeddedLibraryMeta,
  EmbeddedLibraryRunData,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/server-types";
import type { RunLines } from "#/read-runs";

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
}

function parseJsonlLines(lines: ReadonlyArray<string>): Array<JsonlBenchObservationRow> {
  const result: Array<JsonlBenchObservationRow> = [];
  for (const line of lines) {
    try {
      result.push(JSON.parse(line) as JsonlBenchObservationRow);
    } catch {
      // skip malformed lines
    }
  }
  return result;
}

function buildLibraryRunData(
  observations: ReadonlyArray<JsonlBenchObservationRow>,
  libraryName: string,
): LibraryRunData | undefined {
  const libObs = observations.filter((o) => o.libraryName === libraryName);
  if (libObs.length === 0) {
    return undefined;
  }

  const fingerprint = jsonlBenchObservationRowToFingerprint(libObs[0]!);
  const byTrialIndex = new Map<number, Array<ScenarioTrialResult>>();
  const trialHzByScenario = new Map<string, Map<number, number>>();

  for (const obs of libObs) {
    const result = jsonlBenchObservationRowToScenarioTrialResult(obs);
    const list = byTrialIndex.get(obs.trialIndex);
    if (list === undefined) {
      byTrialIndex.set(obs.trialIndex, [result]);
    } else {
      list.push(result);
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
    libraryVersions: libraryNames
      .map((name) => {
        const obs = firstObsByLibrary.get(name);
        return obs !== undefined
          ? { key: name, version: obs.libraryVersion, gcExposed: obs.gcExposed }
          : null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null),
  };
}

function hzLookup(report: LibraryReport, scenarioId: string): number | null {
  const row = report.scenarios.find((s) => s.id === scenarioId);
  return row !== undefined && row.hzPerOpMedian > 0 ? row.hzPerOpMedian : null;
}

function hzIqrFractionLookup(report: LibraryReport, scenarioId: string): number | null {
  const row = report.scenarios.find((s) => s.id === scenarioId);
  if (row === undefined || row.hzPerOpMedian <= 0) {
    return null;
  }
  const f = row.hzPerOpIqrFraction;
  return Number.isFinite(f) && f > 0 ? f : null;
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
  const primaryName = options.libraries.find((l) => l.isPrimary)?.name ?? libraryNames[0] ?? "";

  const runs: Array<RunData> = [];
  for (const raw of rawRuns) {
    const observations = parseJsonlLines(raw.lines);
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

    const meta = extractRunMeta(raw.folderName, observations, libraryNames, primaryName);
    if (meta !== undefined) {
      runs.push({ meta, reports, spreadsPerLib });
    }
  }

  // Collect all scenario IDs and metadata across all runs.
  const scenarioGroup = new Map<string, string>();
  const scenarioWhat = new Map<string, string>();
  for (const run of [...runs].reverse()) {
    for (const [, report] of run.reports) {
      for (const s of report.scenarios) {
        scenarioGroup.set(s.id, s.group);
        if (s.what.length > 0 && !scenarioWhat.has(s.id)) {
          scenarioWhat.set(s.id, s.what);
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

  const scenarios: Array<EmbeddedScenarioSeries> = scenarioIds.map((scenarioId) => {
    const libraryData: Record<string, EmbeddedLibraryRunData> = {};
    for (const libName of libraryNames) {
      const hz: Array<number | null> = [];
      const p25: Array<number | null> = [];
      const p75: Array<number | null> = [];
      const iqrFraction: Array<number | null> = [];
      for (const run of runs) {
        const report = run.reports.get(libName);
        hz.push(report !== undefined ? hzLookup(report, scenarioId) : null);
        iqrFraction.push(report !== undefined ? hzIqrFractionLookup(report, scenarioId) : null);
        const spread = run.spreadsPerLib.get(libName)?.get(scenarioId) ?? null;
        p25.push(spread !== null && spread.p25Hz > 0 ? spread.p25Hz : null);
        p75.push(spread !== null && spread.p75Hz > 0 ? spread.p75Hz : null);
      }
      libraryData[libName] = { hz, p25, p75, iqrFraction };
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
    ...(benchResultsWarning !== undefined ? { benchResultsWarning } : {}),
  };
}
