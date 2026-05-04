import type { ScenarioTrialResult, TrialPayload } from "#/shared/protocol";
import type { JsonlBenchObservationRow } from "#/report/jsonl";
import {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "#/report/jsonl";
import type { LibraryReport } from "#/report/aggregate";
import { buildLibraryReport } from "#/report/aggregate";
import { quantile, sortAscending } from "#/report/quantiles";
import type {
  BenchServerOptions,
  EmbeddedLibraryMeta,
  EmbeddedLibraryRunData,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/server/server-types";
import type { RunLines } from "#/server/read-runs";

function jsonlToLibraryReport(
  lines: readonly string[],
  libraryName: string,
): LibraryReport | undefined {
  const observations: JsonlBenchObservationRow[] = [];
  for (const line of lines) {
    const parsed = JSON.parse(line) as JsonlBenchObservationRow;
    if (parsed.libraryName === libraryName) {
      observations.push(parsed);
    }
  }
  if (observations.length === 0) {
    return undefined;
  }
  const fingerprint = jsonlBenchObservationRowToFingerprint(observations[0]!);
  const byTrialIndex = new Map<number, ScenarioTrialResult[]>();
  for (const obs of observations) {
    const result = jsonlBenchObservationRowToScenarioTrialResult(obs);
    const list = byTrialIndex.get(obs.trialIndex);
    if (list === undefined) {
      byTrialIndex.set(obs.trialIndex, [result]);
    } else {
      list.push(result);
    }
  }
  const trialPayloads: TrialPayload[] = [...byTrialIndex.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([trialIndex, scenarios]) => ({ trialIndex, scenarios }));
  return buildLibraryReport(fingerprint, trialPayloads, []);
}

function hzTrialSpread(
  lines: readonly string[],
  libraryName: string,
  scenarioId: string,
): { p25Hz: number; medianHz: number; p75Hz: number } | null {
  const perTrialHz = new Map<number, number>();
  for (const line of lines) {
    const obs = JSON.parse(line) as JsonlBenchObservationRow;
    if (obs.libraryName !== libraryName || obs.scenarioId !== scenarioId || obs.samples <= 0) {
      continue;
    }
    perTrialHz.set(obs.trialIndex, obs.hzPerOp);
  }
  const sorted = sortAscending([...perTrialHz.values()]);
  if (sorted.length === 0) {
    return null;
  }
  return {
    p25Hz: quantile(sorted, 0.25),
    medianHz: quantile(sorted, 0.5),
    p75Hz: quantile(sorted, 0.75),
  };
}

function extractRunMeta(
  folderName: string,
  lines: readonly string[],
  libraryNames: readonly string[],
): EmbeddedRun | undefined {
  const firstObsByLibrary = new Map<string, JsonlBenchObservationRow>();
  for (const line of lines) {
    const obs = JSON.parse(line) as JsonlBenchObservationRow;
    if (!firstObsByLibrary.has(obs.libraryName) && libraryNames.includes(obs.libraryName)) {
      firstObsByLibrary.set(obs.libraryName, obs);
    }
    if (firstObsByLibrary.size === libraryNames.length) {
      break;
    }
  }
  // Require at least the first configured library to have observations.
  const canonical = firstObsByLibrary.get(libraryNames[0]!);
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
  rawRuns: readonly RunLines[],
  options: BenchServerOptions,
): EmbeddedViewerPayload {
  const libraryNames = options.libraries.map((lib) => lib.name);

  // Filter runs that have data for at least the primary library.
  const primaryName = options.libraries.find((l) => l.isPrimary)?.name ?? libraryNames[0] ?? "";

  interface RunData {
    readonly folderName: string;
    readonly lines: readonly string[];
    readonly reports: Map<string, LibraryReport>;
  }

  const runs: RunData[] = [];
  for (const raw of rawRuns) {
    const reports = new Map<string, LibraryReport>();
    for (const libName of libraryNames) {
      const report = jsonlToLibraryReport(raw.lines, libName);
      if (report !== undefined) {
        reports.set(libName, report);
      }
    }
    if (reports.has(primaryName)) {
      runs.push({ folderName: raw.folderName, lines: raw.lines, reports });
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

  // Build embedded runs.
  const embeddedRuns: EmbeddedRun[] = runs.map((run) => {
    const meta = extractRunMeta(run.folderName, run.lines, libraryNames);
    if (meta === undefined) {
      throw new Error(`build-payload: could not parse run metadata for ${run.folderName}`);
    }
    return meta;
  });

  // Build per-scenario series.
  const scenarios: EmbeddedScenarioSeries[] = scenarioIds.map((scenarioId) => {
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
        const spread = report !== undefined ? hzTrialSpread(run.lines, libName, scenarioId) : null;
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

  const libraries: EmbeddedLibraryMeta[] = options.libraries.map((lib) => ({
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
  };
}
