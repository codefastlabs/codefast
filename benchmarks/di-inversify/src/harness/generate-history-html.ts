#!/usr/bin/env node
/**
 * Builds a self-contained HTML chart from every run under `bench-results/<timestamp>/observations.jsonl`.
 * Open `bench-results/history-viewer.html` in a browser (file:// is fine).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { JsonlBenchObservationRow } from "@codefast/benchmark-harness/jsonl";
import type { LibraryReport } from "@codefast/benchmark-harness/report";
import { buildLibraryReport } from "@codefast/benchmark-harness/report";
import type { ScenarioTrialResult, TrialPayload } from "@codefast/benchmark-harness/protocol";
import { quantile, sortAscending } from "@codefast/benchmark-harness/stats/quantiles";
import {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "@codefast/benchmark-harness/jsonl";

const CODEFAST_LIBRARY = "@codefast/di";
const INVERSIFY_LIBRARY = "inversify";

interface RunPayload {
  readonly folderName: string;
  readonly lines: readonly string[];
  readonly codefast: LibraryReport;
  readonly inversify: LibraryReport;
}

/** Per-run metadata + label for one row in the chart. */
interface EmbeddedRun {
  readonly folder: string;
  /** Stable key for “same machine + Node” filtering. */
  readonly envKey: string;
  readonly envLabel: string;
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly nodeOptions: string;
  readonly gcExposedCodefast: boolean;
  readonly gcExposedInversify: boolean;
  readonly codefastVersion: string;
  readonly inversifyVersion: string;
  readonly timestampIso: string;
}

interface EmbeddedScenarioSeries {
  readonly id: string;
  readonly group: string;
  readonly what: string;
  readonly codefast: readonly (number | null)[];
  readonly inversify: readonly (number | null)[];
  readonly codefastP25: readonly (number | null)[];
  readonly codefastP75: readonly (number | null)[];
  readonly inversifyP25: readonly (number | null)[];
  readonly inversifyP75: readonly (number | null)[];
  readonly codefastIqrFraction: readonly (number | null)[];
  readonly inversifyIqrFraction: readonly (number | null)[];
}

interface EmbeddedViewerPayload {
  readonly runs: readonly EmbeddedRun[];
  readonly scenarios: readonly EmbeddedScenarioSeries[];
}

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function hzTrialSpreadForScenario(
  lines: readonly string[],
  libraryName: string,
  scenarioId: string,
): { p25Hz: number; medianHz: number; p75Hz: number } | null {
  const perTrialHz = new Map<number, number>();
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const observation = JSON.parse(line) as JsonlBenchObservationRow;
    if (
      observation.libraryName !== libraryName ||
      observation.scenarioId !== scenarioId ||
      observation.samples <= 0
    ) {
      continue;
    }
    perTrialHz.set(observation.trialIndex, observation.hzPerOp);
  }
  const hzSorted = sortAscending([...perTrialHz.values()]);
  if (hzSorted.length === 0) {
    return null;
  }
  return {
    p25Hz: quantile(hzSorted, 0.25),
    medianHz: quantile(hzSorted, 0.5),
    p75Hz: quantile(hzSorted, 0.75),
  };
}

function jsonlToLibraryReport(
  lines: readonly string[],
  libraryName: string,
): LibraryReport | undefined {
  const observations: JsonlBenchObservationRow[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
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
  for (const observation of observations) {
    const result = jsonlBenchObservationRowToScenarioTrialResult(observation);
    const list = byTrialIndex.get(observation.trialIndex);
    if (list === undefined) {
      byTrialIndex.set(observation.trialIndex, [result]);
    } else {
      list.push(result);
    }
  }
  const trialPayloads: TrialPayload[] = [...byTrialIndex.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([trialIndex, scenarios]) => ({ trialIndex, scenarios }));
  return buildLibraryReport(fingerprint, trialPayloads, []);
}

function extractRunMeta(folderName: string, lines: readonly string[]): EmbeddedRun | undefined {
  let codefastObservation: JsonlBenchObservationRow | undefined;
  let inversifyObservation: JsonlBenchObservationRow | undefined;
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const observation = JSON.parse(line) as JsonlBenchObservationRow;
    if (observation.libraryName === CODEFAST_LIBRARY && codefastObservation === undefined) {
      codefastObservation = observation;
    }
    if (observation.libraryName === INVERSIFY_LIBRARY && inversifyObservation === undefined) {
      inversifyObservation = observation;
    }
    if (codefastObservation !== undefined && inversifyObservation !== undefined) {
      break;
    }
  }
  if (codefastObservation === undefined || inversifyObservation === undefined) {
    return undefined;
  }
  const canonical = codefastObservation;
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
    gcExposedCodefast: codefastObservation.gcExposed,
    gcExposedInversify: inversifyObservation.gcExposed,
    codefastVersion: codefastObservation.libraryVersion,
    inversifyVersion: inversifyObservation.libraryVersion,
    timestampIso: canonical.timestampIso,
  };
}

function readRunDirectory(runDirectoryPath: string, folderName: string): RunPayload | undefined {
  const jsonlPath = join(runDirectoryPath, "observations.jsonl");
  let content: string;
  try {
    content = readFileSync(jsonlPath, "utf8");
  } catch {
    return undefined;
  }
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const codefast = jsonlToLibraryReport(lines, CODEFAST_LIBRARY);
  const inversify = jsonlToLibraryReport(lines, INVERSIFY_LIBRARY);
  if (codefast === undefined || inversify === undefined) {
    return undefined;
  }
  return { folderName, lines, codefast, inversify };
}

function listHistoricalRuns(benchResultsDirectory: string): RunPayload[] {
  const entries = readdirSync(benchResultsDirectory, { withFileTypes: true });
  const runs: RunPayload[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const folderName = entry.name;
    const run = readRunDirectory(join(benchResultsDirectory, folderName), folderName);
    if (run !== undefined) {
      runs.push(run);
    }
  }
  runs.sort((left, right) => left.folderName.localeCompare(right.folderName));
  return runs;
}

function hzLookup(report: LibraryReport, scenarioId: string): number | null {
  const row = report.scenarios.find((scenario) => scenario.id === scenarioId);
  if (row === undefined || row.hzPerOpMedian <= 0) {
    return null;
  }
  return row.hzPerOpMedian;
}

function hzIqrFractionLookup(report: LibraryReport, scenarioId: string): number | null {
  const row = report.scenarios.find((scenario) => scenario.id === scenarioId);
  if (row === undefined || row.hzPerOpMedian <= 0) {
    return null;
  }
  const fraction = row.hzPerOpIqrFraction;
  if (!Number.isFinite(fraction) || fraction <= 0) {
    return null;
  }
  return fraction;
}

function whatLookup(report: LibraryReport, scenarioId: string): string {
  const row = report.scenarios.find((scenario) => scenario.id === scenarioId);
  return row?.what ?? "";
}

function buildEmbeddedPayload(runs: readonly RunPayload[]): EmbeddedViewerPayload {
  const scenarioGroup = new Map<string, string>();
  const scenarioWhat = new Map<string, string>();
  for (const run of [...runs].reverse()) {
    for (const scenario of run.codefast.scenarios) {
      scenarioGroup.set(scenario.id, scenario.group);
      if (scenario.what.length > 0) {
        scenarioWhat.set(scenario.id, scenario.what);
      }
    }
    for (const scenario of run.inversify.scenarios) {
      if (!scenarioGroup.has(scenario.id)) {
        scenarioGroup.set(scenario.id, scenario.group);
      }
      if (!scenarioWhat.has(scenario.id) && scenario.what.length > 0) {
        scenarioWhat.set(scenario.id, scenario.what);
      }
    }
  }
  const scenarioIds = new Set<string>();
  for (const run of runs) {
    for (const scenario of run.codefast.scenarios) {
      scenarioIds.add(scenario.id);
    }
    for (const scenario of run.inversify.scenarios) {
      scenarioIds.add(scenario.id);
    }
  }
  const sortedScenarioIds = [...scenarioIds].sort((left, right) => {
    const groupLeft = scenarioGroup.get(left) ?? "";
    const groupRight = scenarioGroup.get(right) ?? "";
    const groupCompare = groupLeft.localeCompare(groupRight);
    if (groupCompare !== 0) {
      return groupCompare;
    }
    return left.localeCompare(right);
  });

  const embeddedRuns: EmbeddedRun[] = runs.map((run) => {
    const meta = extractRunMeta(run.folderName, run.lines);
    if (meta === undefined) {
      throw new Error(`Bench history: could not parse run metadata for ${run.folderName}`);
    }
    return meta;
  });

  const scenarios: EmbeddedScenarioSeries[] = sortedScenarioIds.map((scenarioId) => {
    const codefast: Array<number | null> = [];
    const inversify: Array<number | null> = [];
    const codefastP25: Array<number | null> = [];
    const codefastP75: Array<number | null> = [];
    const inversifyP25: Array<number | null> = [];
    const inversifyP75: Array<number | null> = [];
    const codefastIqrFraction: Array<number | null> = [];
    const inversifyIqrFraction: Array<number | null> = [];

    for (const run of runs) {
      codefast.push(hzLookup(run.codefast, scenarioId));
      inversify.push(hzLookup(run.inversify, scenarioId));
      const spreadCf = hzTrialSpreadForScenario(run.lines, CODEFAST_LIBRARY, scenarioId);
      const spreadIv = hzTrialSpreadForScenario(run.lines, INVERSIFY_LIBRARY, scenarioId);
      codefastP25.push(spreadCf !== null && spreadCf.p25Hz > 0 ? spreadCf.p25Hz : null);
      codefastP75.push(spreadCf !== null && spreadCf.p75Hz > 0 ? spreadCf.p75Hz : null);
      inversifyP25.push(spreadIv !== null && spreadIv.p25Hz > 0 ? spreadIv.p25Hz : null);
      inversifyP75.push(spreadIv !== null && spreadIv.p75Hz > 0 ? spreadIv.p75Hz : null);
      codefastIqrFraction.push(hzIqrFractionLookup(run.codefast, scenarioId));
      inversifyIqrFraction.push(hzIqrFractionLookup(run.inversify, scenarioId));
    }

    let what = scenarioWhat.get(scenarioId) ?? "";
    if (what.length === 0) {
      for (const run of runs) {
        const fromCf = whatLookup(run.codefast, scenarioId);
        const fromIv = whatLookup(run.inversify, scenarioId);
        what = fromCf.length > 0 ? fromCf : fromIv;
        if (what.length > 0) {
          break;
        }
      }
    }

    return {
      id: scenarioId,
      group: scenarioGroup.get(scenarioId) ?? "unknown",
      what,
      codefast,
      inversify,
      codefastP25,
      codefastP75,
      inversifyP25,
      inversifyP75,
      codefastIqrFraction,
      inversifyIqrFraction,
    };
  });

  return { runs: embeddedRuns, scenarios };
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHtml(payload: EmbeddedViewerPayload): string {
  const json = JSON.stringify(payload);
  const runCount = String(payload.runs.length);
  const scenarioCount = String(payload.scenarios.length);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>@codefast/di vs inversify — bench history</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style id="bh-ui-styles">
    .bh-metrics { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr)); }
    @media (min-width: 640px) { .bh-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .bh-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .bh-card { border-radius: 0.75rem; border: 1px solid rgba(63, 63, 70, 0.85); background: rgba(24, 24, 27, 0.72); padding: 0.8rem 1rem; backdrop-filter: blur(6px); }
    .bh-lbl { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(161, 161, 170); margin-bottom: 0.35rem; }
    .bh-val { font-variant-numeric: tabular-nums; font-size: 1.05rem; font-weight: 600; line-height: 1.3; word-break: break-word; }
    .bh-chip { display: inline-flex; align-items: center; border-radius: 9999px; padding: 0.15rem 0.65rem; font-size: 0.7rem; font-weight: 500; }
    .bh-chip-warn { background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.35); color: rgb(253 230 138); }
    .bh-chip-ok { background: rgba(16, 185, 129, 0.11); border: 1px solid rgba(16, 185, 129, 0.35); color: rgb(167 243 208); }
    .bh-table-wrap { overflow-x: auto; border-radius: 0.5rem; border: 1px solid rgba(63, 63, 70, 0.6); }
    .bh-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .bh-table th,
    .bh-table td { border-bottom: 1px solid rgb(39, 39, 42); padding: 0.45rem 0.65rem; text-align: left; }
    .bh-table th { color: rgb(161, 161, 170); font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    .bh-table tbody tr:hover { background: rgba(63, 63, 70, 0.18); }
    .bh-num { font-variant-numeric: tabular-nums; text-align: right; font-variant-ligatures: none; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js" crossorigin="anonymous"></script>
</head>
<body class="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 font-sans text-zinc-200 antialiased">
  <div class="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:pt-8">
    <header class="mb-8 max-w-3xl border-b border-zinc-800/80 pb-6">
      <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-emerald-500/95">Bench history viewer</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
        Benchmark history<span class="font-normal text-zinc-400"> · hz/op median per run</span>
      </h1>
      <p class="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">
        Quantiles mirror <code class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.88em] text-indigo-200">report.ts</code> across trials. Bands are per‑trial hz/op spread; tooltip IQR%
        surfaces noisy runs.
        Axis labels show each point in your <strong class="font-medium text-zinc-300">local time</strong> (UTC stored as
        <code class="font-mono text-indigo-200/95">timestampIso</code>).
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="History overview">
      <div class="bh-card hover:border-emerald-500/20">
        <div class="bh-lbl">Saved runs</div>
        <div id="kpi-run-count" class="bh-val text-zinc-100">—</div>
      </div>
      <div class="bh-card hover:border-sky-500/15">
        <div class="bh-lbl">Scenarios tracked</div>
        <div id="kpi-scenario-count" class="bh-val text-zinc-100">—</div>
      </div>
      <div class="bh-card sm:col-span-2 xl:col-span-1">
        <div class="bh-lbl">Newest saved run · local clock</div>
        <div id="kpi-latest-clock" class="bh-val text-sm text-zinc-200">—</div>
      </div>
      <div class="bh-card xl:col-span-1">
        <div class="bh-lbl">Library builds (latest run)</div>
        <div id="kpi-lib-versions" class="bh-val text-xs font-normal leading-snug text-zinc-400">—</div>
      </div>
    </div>

    <div
      id="multi-env-banner"
      role="status"
      class="mt-4 hidden rounded-lg border border-amber-500/25 bg-amber-950/35 px-3 py-2.5 text-sm text-amber-100/95"
    >
      <strong class="font-semibold text-amber-200">Multiple environments in history.</strong>
      Prefer an Environment filter before comparing regimes (CPU × Node fingerprints differ across machines).
    </div>

    <div
      class="sticky top-0 z-40 mb-7 mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/90 px-3 py-2.5 shadow-lg shadow-black/35 backdrop-blur-md sm:-mx-2 sm:px-4"
    >
      <span class="hidden sm:inline text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">Focus</span>
      <label class="min-w-[min(100%,220px)] flex-1 sm:min-w-[14rem] sm:max-w-md">
        <span class="mb-1 block text-[0.75rem] text-zinc-500">Scenario</span>
        <select
          id="scenario-select"
          aria-label="Benchmark scenario"
          class="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-2 text-sm text-zinc-100 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        ></select>
      </label>
      <label class="min-w-[min(100%,260px)] flex-[1.1] sm:max-w-[22rem]">
        <span class="mb-1 block text-[0.75rem] text-zinc-500">Environment</span>
        <select
          id="env-filter"
          aria-label="Filter runs by CPU and Node"
          class="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="">All runs</option>
        </select>
      </label>
      <button
        type="button"
        id="chart-download-png"
        title="Capture current chart view as PNG"
        class="ml-auto shrink-0 rounded-lg border border-indigo-500/40 bg-indigo-950/50 px-3.5 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
      >
        Download PNG
      </button>
    </div>

    <section class="mb-8 rounded-xl border border-zinc-800/75 bg-zinc-900/25 px-4 py-4 shadow-sm shadow-black/20 sm:px-5">
      <h2 class="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">Discovery</h2>
      <div class="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
        <label class="block shrink-0">
          <span class="mb-1 block text-[0.82rem] text-zinc-500">Search</span>
          <input
            type="search"
            id="scenario-search"
            placeholder="Filter by scenario, group…"
            autocomplete="off"
            class="min-w-48 max-w-xs rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>
        <label class="block shrink-0">
          <span class="mb-1 block text-[0.82rem] text-zinc-500">Group</span>
          <select
            id="group-filter"
            aria-label="Filter by group"
            class="min-w-[10.5rem] rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="">All groups</option></select>
        </label>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-800/80 pt-4 text-[0.9rem] text-zinc-300">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-600">Chart</span>
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" id="show-bands" checked class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
          P25–P75 band
        </label>
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" id="log-scale" class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
          Log Y axis
        </label>
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" id="show-ratio" class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" />
          codefast ÷ inversify
        </label>
      </div>
    </section>

    <section
      id="summary"
      aria-live="polite"
      class="mb-6 rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 px-4 py-4 sm:px-5"
    >
      <div class="flex flex-wrap items-baseline gap-2 gap-y-1">
        <h2 id="metrics-heading" class="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">Selected scenario metrics</h2>
        <span id="metrics-scenario-chip" class="bh-chip bh-chip-ok"></span>
      </div>
      <p id="scenario-what-line" class="mt-2 text-sm leading-relaxed text-zinc-400"></p>
      <div id="metrics-cards" class="mt-5"></div>
      <p id="metrics-footnote" class="mt-3 text-xs leading-relaxed text-zinc-500"></p>
    </section>

    <section aria-labelledby="chart-section-title" class="rounded-xl border border-zinc-800/75 bg-zinc-900/20 px-4 py-4 sm:px-5">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div>
          <h2 id="chart-section-title" class="text-sm font-semibold text-zinc-100">Throughput over filtered runs</h2>
          <p id="chart-subtitle-line" class="mt-1 text-[0.8rem] text-zinc-500">—</p>
        </div>
      </div>
      <div class="mb-2 mt-4 flex flex-wrap items-center gap-2">
        <span class="text-[0.7rem] uppercase tracking-wide text-zinc-600">View</span>
        <button type="button" id="chart-zoom-in" class="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Zoom in on time axis">Zoom +</button>
        <button type="button" id="chart-zoom-out" class="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Zoom out on time axis">Zoom −</button>
        <button type="button" id="chart-pan-earlier" class="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Pan to earlier runs">← Earlier</button>
        <button type="button" id="chart-pan-later" class="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Pan to later runs">Later →</button>
        <button type="button" id="chart-reset-zoom" class="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80">Reset zoom</button>
      </div>
      <p class="text-xs leading-relaxed text-zinc-500">
        Opens on the newest portion of history; Reset zoom restores the whole filtered range.&nbsp;<kbd class="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">Ctrl</kbd>+wheel zooms · drag pans · legend hides series.
      </p>
      <div id="chart-host" class="relative mt-4 h-[min(440px,58vh)] w-full min-h-[280px] rounded-lg bg-zinc-950/40 ring-1 ring-zinc-800/70">
        <canvas id="bench-chart" aria-label="Throughput over time chart" class="block h-full w-full"></canvas>
      </div>
    </section>

    <details class="mt-8 rounded-xl border border-zinc-800/75 bg-zinc-900/15 px-4 py-3 open:bg-zinc-900/35 sm:px-5">
      <summary class="cursor-pointer py-2 text-sm font-semibold leading-snug text-zinc-200 [&::-webkit-details-marker]:text-indigo-400">
        Snapshot of <span class="text-indigo-200/95">globally newest</span> bench folder — throughput by scenario (table)
      </summary>
      <p class="mb-3 text-xs leading-relaxed text-zinc-500">
        Rows use the chronologically last run directory (${escapeHtml(runCount)} total), independent of the Environment selector above — useful against the line chart filtered view.
      </p>
      <div class="bh-table-wrap">
        <table class="bh-table" aria-label="Latest run throughput by scenario">
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Group</th>
              <th scope="col" class="bh-num text-emerald-200">@codefast/di</th>
              <th scope="col" class="bh-num text-sky-300">inversify</th>
              <th scope="col" class="bh-num text-amber-200">Ratio</th>
            </tr>
          </thead>
          <tbody id="snapshot-latest-tbody"></tbody>
        </table>
      </div>
      <div id="snapshot-latest-meta" class="mt-2 text-xs text-zinc-600"></div>
    </details>

    <p class="mt-8 border-t border-zinc-800/80 pt-5 text-[0.78rem] text-zinc-500">
      Generated locally — <code class="rounded bg-zinc-900 px-1 py-px font-mono text-[0.85em] text-indigo-200">pnpm bench:history</code> ·
      ${escapeHtml(runCount)} runs · ${escapeHtml(scenarioCount)} scenarios
    </p>
  </div>
  <script type="application/json" id="bench-history-data">${json}</script>
  <script>
(function () {
  const raw = document.getElementById("bench-history-data");
  const data = JSON.parse(raw.textContent);
  const scenarioSearch = document.getElementById("scenario-search");
  const scenarioSelect = document.getElementById("scenario-select");
  const groupFilter = document.getElementById("group-filter");
  const envFilter = document.getElementById("env-filter");
  const showBands = document.getElementById("show-bands");
  const logScale = document.getElementById("log-scale");
  const showRatio = document.getElementById("show-ratio");
  const chartSubtitleLine = document.getElementById("chart-subtitle-line");
  const metricsScenarioChip = document.getElementById("metrics-scenario-chip");
  const scenarioWhatLineEl = document.getElementById("scenario-what-line");
  const metricsCardsEl = document.getElementById("metrics-cards");
  const metricsFootnoteEl = document.getElementById("metrics-footnote");
  const multiEnvBanner = document.getElementById("multi-env-banner");

  const btnResetZoom = document.getElementById("chart-reset-zoom");
  const btnDownload = document.getElementById("chart-download-png");
  const btnZoomIn = document.getElementById("chart-zoom-in");
  const btnZoomOut = document.getElementById("chart-zoom-out");
  const btnPanEarlier = document.getElementById("chart-pan-earlier");
  const btnPanLater = document.getElementById("chart-pan-later");

  var ZOOM_STEP_X = 1.15;
  var PAN_PIXELS_X = 120;
  if (typeof Chart !== "undefined" && typeof ChartZoom !== "undefined") {
    Chart.register(ChartZoom);
  }

  let chart = null;
  let resizeScheduled = false;
  function scheduleChartResize() {
    if (!chart || resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(function () {
      resizeScheduled = false;
      if (chart) chart.resize();
    });
  }
  window.addEventListener("resize", scheduleChartResize);

  const envKeys = [...new Set(data.runs.map(function (r) { return r.envKey; }))].sort();
  for (const key of envKeys) {
    const sample = data.runs.find(function (r) { return r.envKey === key; });
    if (!sample) continue;
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = sample.envLabel;
    envFilter.appendChild(opt);
  }

  const groups = [...new Set(data.scenarios.map(function (s) { return s.group; }))].sort();
  for (const g of groups) {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    groupFilter.appendChild(opt);
  }

  function searchNorm(s) { return String(s || "").toLowerCase(); }

  function visibleScenarios() {
    const gf = groupFilter.value;
    const q = searchNorm(scenarioSearch.value).trim();
    return data.scenarios.filter(function (s) {
      if (gf && s.group !== gf) return false;
      if (!q) return true;
      return searchNorm(s.id).includes(q) || searchNorm(s.group).includes(q) || searchNorm(s.what).includes(q);
    });
  }

  function filteredRunIndices() {
    const key = envFilter.value;
    if (!key) {
      return data.runs.map(function (_, i) { return i; });
    }
    const out = [];
    for (let i = 0; i < data.runs.length; i++) {
      if (data.runs[i].envKey === key) out.push(i);
    }
    return out;
  }

  function sliceByIndices(arr, indices) {
    return indices.map(function (i) { return arr[i]; });
  }

  function fillScenarioOptions() {
    const list = visibleScenarios();
    const previous = scenarioSelect.value;
    scenarioSelect.innerHTML = "";
    for (const s of list) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = "[" + s.group + "] " + s.id;
      scenarioSelect.appendChild(opt);
    }
    if (list.some(function (s) { return s.id === previous; })) {
      scenarioSelect.value = previous;
    } else if (list.length > 0) {
      scenarioSelect.selectedIndex = 0;
    }
  }

  fillScenarioOptions();

  function ratioFrom(cf, inv) {
    if (typeof cf !== "number" || typeof inv !== "number" || cf <= 0 || inv <= 0) return null;
    return cf / inv;
  }

  function formatBenchRunInstantLocal(timestampIso, fallbackFolder) {
    if (!timestampIso) {
      return fallbackFolder || "";
    }
    var d = new Date(timestampIso);
    if (Number.isNaN(d.getTime())) {
      return fallbackFolder || "";
    }
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function fmtHz(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) return "—";
    return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function fmtPctChange(from, to) {
    if (from === null || to === null || from <= 0 || to <= 0) return "—";
    const pct = ((to - from) / from) * 100;
    const sign = pct >= 0 ? "+" : "";
    return sign + pct.toFixed(1) + "%";
  }

  /** Client-side escaping for interpolated markup (scenario identifiers in tables). */
  function esc(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function medianNumeric(values) {
    const a = values.filter(function (v) {
      return typeof v === "number" && Number.isFinite(v);
    }).sort(function (x, y) {
      return x - y;
    });
    if (a.length === 0) {
      return null;
    }
    var m = Math.floor(a.length / 2);
    if (a.length % 2 === 1) {
      return a[m];
    }
    return ((a[m - 1] ?? 0) + (a[m] ?? 0)) / 2;
  }

  var DISPERSION_IQR_ALERT = 0.25;

  function updateMetricsPanel(row, indices) {
    var chipEl = metricsScenarioChip;
    var whatEl = scenarioWhatLineEl;
    var cardsEl = metricsCardsEl;
    var footEl = metricsFootnoteEl;
    if (!chipEl || !whatEl || !cardsEl || !footEl) return;
    if (!row || indices.length < 1) {
      chipEl.textContent = "";
      chipEl.className = "bh-chip bh-chip-ok";
      whatEl.textContent = "";
      whatEl.style.display = "none";
      cardsEl.innerHTML = "";
      footEl.textContent = "";
      return;
    }

    chipEl.textContent = "[" + row.group + "] " + row.id;
    chipEl.className = "bh-chip bh-chip-ok";
    whatEl.style.display = row.what ? "block" : "none";
    whatEl.textContent = row.what || "";

    var cfOrdered = indices
      .map(function (gx) {
        var v = row.codefast[gx];
        return typeof v === "number" && v > 0 ? v : null;
      })
      .filter(function (x) {
        return x !== null && x !== undefined;
      });
    var ivOrdered = indices
      .map(function (gx) {
        var v = row.inversify[gx];
        return typeof v === "number" && v > 0 ? v : null;
      })
      .filter(function (x) {
        return x !== null && x !== undefined;
      });

    var cfMedian = medianNumeric(
      indices.map(function (gx) {
        return row.codefast[gx];
      }).filter(function (v) {
        return typeof v === "number" && v > 0;
      }),
    );
    var ivMedian = medianNumeric(
      indices.map(function (gx) {
        return row.inversify[gx];
      }).filter(function (v) {
        return typeof v === "number" && v > 0;
      }),
    );

    var cfLo = cfOrdered.length ? Math.min.apply(Math, cfOrdered) : null;
    var cfHi = cfOrdered.length ? Math.max.apply(Math, cfOrdered) : null;
    var ivLo = ivOrdered.length ? Math.min.apply(Math, ivOrdered) : null;
    var ivHi = ivOrdered.length ? Math.max.apply(Math, ivOrdered) : null;

    var cfFirstLast =
      cfOrdered.length >= 2
        ? fmtPctChange(cfOrdered[0], cfOrdered[cfOrdered.length - 1]) + ", newest vs oldest visible"
        : "—";
    var ivFirstLast =
      ivOrdered.length >= 2
        ? fmtPctChange(ivOrdered[0], ivOrdered[ivOrdered.length - 1]) + ", newest vs oldest visible"
        : "—";

    var ratiosMedian = medianNumeric(
      indices
        .map(function (gx) {
          var r = ratioFrom(row.codefast[gx], row.inversify[gx]);
          return r !== null && r !== undefined ? r : null;
        })
        .filter(function (v) {
          return v !== null && v !== undefined;
        }),
    );

    var maxCfIqr = 0;
    var maxIvIqr = 0;
    indices.forEach(function (gx) {
      var fracCf = row.codefastIqrFraction[gx];
      if (typeof fracCf === "number" && Number.isFinite(fracCf)) {
        maxCfIqr = Math.max(maxCfIqr, fracCf);
      }
      var fracIv = row.inversifyIqrFraction[gx];
      if (typeof fracIv === "number" && Number.isFinite(fracIv)) {
        maxIvIqr = Math.max(maxIvIqr, fracIv);
      }
    });

    var html = "";
    html += '<div class="bh-metrics">';
    html += '<div class="bh-card"><div class="bh-lbl" style="color:rgb(167 243 208)">@codefast/di median hz/op</div>';
    html += '<div class="bh-val" style="color:rgb(167 243 208)">';
    html += cfMedian !== null ? fmtHz(cfMedian) + " Hz/op" : "—";
    html += '</div>';
    html += '<div class="mt-1 font-mono text-[0.72rem]" style="color:rgb(161 161 170)">';
    html += cfLo !== null && cfHi !== null ? "Range " + fmtHz(cfLo) + " … " + fmtHz(cfHi) : "";
    html += "</div></div>";

    html += '<div class="bh-card"><div class="bh-lbl" style="color:rgb(186 213 254)">inversify median hz/op</div>';
    html += '<div class="bh-val" style="color:rgb(186 213 254)">';
    html += ivMedian !== null ? fmtHz(ivMedian) + " Hz/op" : "—";
    html += '</div>';
    html += '<div class="mt-1 font-mono text-[0.72rem]" style="color:rgb(161 161 170)">';
    html += ivLo !== null && ivHi !== null ? "Range " + fmtHz(ivLo) + " … " + fmtHz(ivHi) : "";
    html += "</div></div>";

    html += '<div class="bh-card"><div class="bh-lbl" style="color:rgb(253 224 169)">Median paired ratio · codefast ÷ inversify</div>';
    html += '<div class="bh-val" style="color:rgb(253 224 169)">';
    html += ratiosMedian !== null ? ratiosMedian.toFixed(3) + "×" : "—";
    html += '</div>';
    html += "</div>";

    html += '<div class="bh-card"><div class="bh-lbl">Δ along plotted timeline</div>';
    html += '<div class="text-[0.78rem] leading-snug" style="color:rgb(212 212 216)">';
    html += '<div>@codefast/di: ' + cfFirstLast + "</div>";
    html += '<div class="mt-1">inversify: ' + ivFirstLast + "</div>";
    html += "</div></div>";

    html += '<div class="bh-card">';
    html += '<div class="bh-lbl">Worst IQR÷median · per plotted run</div>';
    html += '<div class="text-[0.78rem] leading-snug" style="color:rgb(212 212 216)">';
    html +=
      "codefast: " +
      (maxCfIqr ? (maxCfIqr * 100).toFixed(1) + "%" : "—") +
      " · inversify: " +
      (maxIvIqr ? (maxIvIqr * 100).toFixed(1) + "%" : "—");
    html += "</div></div>";

    html += "</div>";

    cardsEl.innerHTML = html;

    var worst = Math.max(maxCfIqr, maxIvIqr);
    var footPieces = [];
    footPieces.push(
      indices.length +
        " plotted point(s)" +
        (envFilter.value ? ", environment filter on" : ", all environments"),
    );
    if (worst > DISPERSION_IQR_ALERT) {
      footPieces.push(
        "elevated per-trial dispersion (IQR above " +
          DISPERSION_IQR_ALERT * 100 +
          "% of median) on ≥1 plotted run—inspect tooltip IQR%",
      );
      chipEl.className = "bh-chip bh-chip-warn";
    } else {
      chipEl.className = "bh-chip bh-chip-ok";
    }
    footEl.textContent = footPieces.join(". ") + ".";
  }

  function refreshEnvironmentBannerVisibility() {
    if (!multiEnvBanner) return;
    var keys = [...new Set(data.runs.map(function (r) { return r.envKey; }))];
    multiEnvBanner.classList.toggle("hidden", keys.length <= 1 || !!envFilter.value);
  }

  function applyKpis() {
    var runCountEl = document.getElementById("kpi-run-count");
    var scenCountEl = document.getElementById("kpi-scenario-count");
    var clockEl = document.getElementById("kpi-latest-clock");
    var verEl = document.getElementById("kpi-lib-versions");
    if (!runCountEl || !scenCountEl || !clockEl || !verEl) return;
    runCountEl.textContent = String(data.runs.length);
    scenCountEl.textContent = String(data.scenarios.length);
    if (data.runs.length === 0) {
      clockEl.textContent = "—";
      verEl.textContent = "—";
      return;
    }
    var lr = data.runs[data.runs.length - 1];
    var clock = formatBenchRunInstantLocal(lr.timestampIso, lr.folder);
    clockEl.textContent = clock ? clock + " · folder " + lr.folder : lr.folder;
    verEl.innerHTML =
      '<div style="line-height:1.45;"><span style="color:#a3a3a8">@codefast/di</span> <span>' +
      esc(lr.codefastVersion) +
      '</span></div><div style="line-height:1.45;margin-top:4px;"><span style="color:#a3a3a8">inversify</span> <span>' +
      esc(lr.inversifyVersion) +
      "</span></div>";
  }

  function populateLatestSnapshotTableBody() {
    var tbody = document.getElementById("snapshot-latest-tbody");
    var metaEl = document.getElementById("snapshot-latest-meta");
    if (!tbody || !metaEl) return;
    tbody.innerHTML = "";
    if (data.runs.length === 0) {
      metaEl.textContent = "";
      return;
    }
    var lastIx = data.runs.length - 1;
    data.scenarios.forEach(function (s) {
      var cf = s.codefast[lastIx];
      var iv = s.inversify[lastIx];
      var hasCf = typeof cf === "number" && cf > 0;
      var hasIv = typeof iv === "number" && iv > 0;
      var r = "—";
      if (hasCf && hasIv) {
        r = (cf / iv).toFixed(3) + "×";
      }
      var rowEl = document.createElement("tr");
      rowEl.innerHTML =
        "<td>" +
        esc(s.id) +
        "</td><td>" +
        esc(s.group) +
        '</td><td class="bh-num">' +
        (hasCf ? esc(fmtHz(cf)) : "—") +
        '</td><td class="bh-num">' +
        (hasIv ? esc(fmtHz(iv)) : "—") +
        '</td><td class="bh-num">' +
        esc(r) +
        "</td>";
      tbody.appendChild(rowEl);
    });
    var runMeta = data.runs[lastIx];
    metaEl.textContent =
      "Folder " +
      runMeta.folder +
      " · " +
      formatBenchRunInstantLocal(runMeta.timestampIso, runMeta.folder) +
      " (local)";
  }

  applyKpis();
  populateLatestSnapshotTableBody();
  refreshEnvironmentBannerVisibility();

  function render() {
    const id = scenarioSelect.value;
    const row = data.scenarios.find(function (s) { return s.id === id; });
    const indices = filteredRunIndices();
    if (!row || indices.length === 0) {
      if (chart) chart.destroy();
      chart = null;
      updateMetricsPanel(null, []);
      if (chartSubtitleLine) {
        if (indices.length === 0 && data.runs.length > 0) {
          chartSubtitleLine.textContent =
            "No saved runs match the current Environment filter.";
        } else if (!row) {
          chartSubtitleLine.textContent = "No scenario is available for these filters.";
        } else {
          chartSubtitleLine.textContent = "";
        }
      }
      return;
    }

    if (chartSubtitleLine) {
      chartSubtitleLine.textContent =
        "[" +
        row.group +
        "] " +
        row.id +
        " · " +
        indices.length +
        " plotted point(s)" +
        (envFilter.value ? " · environment filter on" : "");
    }
    const labels = indices.map(function (i) {
      var run = data.runs[i];
      return formatBenchRunInstantLocal(run.timestampIso, run.folder);
    });
    const runsSlice = indices.map(function (i) { return data.runs[i]; });

    const cf = sliceByIndices(row.codefast, indices);
    const iv = sliceByIndices(row.inversify, indices);
    const cf25 = sliceByIndices(row.codefastP25, indices);
    const cf75 = sliceByIndices(row.codefastP75, indices);
    const iv25 = sliceByIndices(row.inversifyP25, indices);
    const iv75 = sliceByIndices(row.inversifyP75, indices);

    const datasets = [];
    const bandOn = showBands.checked;

    if (bandOn) {
      datasets.push({
        label: "codefast P25",
        data: cf25,
        borderWidth: 0,
        pointRadius: 0,
        borderColor: "transparent",
        backgroundColor: "transparent",
        spanGaps: false,
        yAxisID: "y",
        order: 10,
      });
      datasets.push({
        label: "codefast P25–P75",
        data: cf75,
        borderWidth: 0,
        pointRadius: 0,
        fill: "-1",
        borderColor: "transparent",
        backgroundColor: "rgba(110,231,197,0.18)",
        spanGaps: false,
        yAxisID: "y",
        order: 10,
      });
      datasets.push({
        label: "inversify P25",
        data: iv25,
        borderWidth: 0,
        pointRadius: 0,
        borderColor: "transparent",
        backgroundColor: "transparent",
        spanGaps: false,
        yAxisID: "y",
        order: 10,
      });
      datasets.push({
        label: "inversify P25–P75",
        data: iv75,
        borderWidth: 0,
        pointRadius: 0,
        fill: "-1",
        borderColor: "transparent",
        backgroundColor: "rgba(147,180,255,0.16)",
        spanGaps: false,
        yAxisID: "y",
        order: 10,
      });
    }

    datasets.push({
      label: "@codefast/di hz/op (median)",
      data: cf,
      borderColor: "#6ee7c5",
      backgroundColor: "rgba(110,231,197,0.08)",
      spanGaps: false,
      yAxisID: "y",
      tension: 0.12,
      order: 5,
    });
    datasets.push({
      label: "inversify hz/op (median)",
      data: iv,
      borderColor: "#93b4ff",
      backgroundColor: "rgba(147,180,255,0.08)",
      spanGaps: false,
      yAxisID: "y",
      tension: 0.12,
      order: 5,
    });

    if (showRatio.checked) {
      const ratioData = [];
      for (let i = 0; i < labels.length; i++) {
        ratioData.push(ratioFrom(cf[i], iv[i]));
      }
      datasets.push({
        label: "codefast ÷ inversify",
        data: ratioData,
        borderColor: "#fbbf77",
        backgroundColor: "rgba(251,191,119,0.08)",
        spanGaps: true,
        yAxisID: "y1",
        tension: 0.12,
        order: 3,
      });
    }

    const yType = logScale.checked ? "logarithmic" : "linear";
    var scales = {
      x: {
        type: "category",
        offset: true,
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.min(22, Math.max(labels.length || 2, 2)),
          maxRotation: 52,
          minRotation: 0,
          color: "#999",
        },
        grid: { color: "#2a2a36", drawOnChartArea: true },
      },
      y: {
        type: yType,
        position: "left",
        title: { display: true, text: "hz/op", color: "#aaa" },
        ticks: { color: "#999" },
        grid: { color: "#2a2a36" },
      },
    };
    if (showRatio.checked) {
      scales.y1 = {
        type: "linear",
        position: "right",
        title: { display: true, text: "ratio", color: "#aaa" },
        ticks: { color: "#b98" },
        grid: { drawOnChartArea: false },
      };
    }

    updateMetricsPanel(row, indices);

    var pluginsMerged = {
      legend: {
        labels: {
          color: "#ccc",
          filter: function (legendItem, _chartData) {
            const title = legendItem.text || "";
            if (title === "codefast P25" || title === "inversify P25") return false;
            return true;
          },
        },
      },
      tooltip: {
        filter: function (item) {
          const title = item.dataset.label || "";
          if (title === "codefast P25" || title === "inversify P25") return false;
          if (title.indexOf("P25–P75") >= 0) return false;
          return true;
        },
        callbacks: {
            title: function (items) {
              if (!items.length) return "";
              const idx = items[0].dataIndex;
              const run = runsSlice[idx];
              if (!run) return "";
              const localClock = formatBenchRunInstantLocal(run.timestampIso, run.folder);
              return localClock
                ? localClock + " (local)" + String.fromCharCode(10) + run.folder
                : run.folder;
            },
          afterTitle: function (items) {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            const run = runsSlice[idx];
            if (!run) return "";
            var lines =
              [
                run.cpuModel + " · " + run.platform + "/" + run.arch,
                "Node " + run.nodeVersion + " · V8 " + run.v8Version,
                "@codefast/di " + run.codefastVersion + " · inversify " + run.inversifyVersion,
              ];
            return lines.join(String.fromCharCode(10));
          },
          label: function (ctx) {
            const v = ctx.raw;
            const lbl = ctx.dataset.label || "";
            if (lbl.indexOf("P25–P75") >= 0) return null;
            if (lbl.indexOf("P25") >= 0) return null;
            if (lbl === "__hidden__") return null;
            if (v === null || v === undefined) return lbl + ": —";
            if (ctx.dataset.yAxisID === "y1") return lbl + ": " + Number(v).toFixed(3) + "×";
            const runIndexFiltered = ctx.dataIndex;
            const scenarioRow = row;
            const globalIx = indices[runIndexFiltered];
            var extra = "";
            if (lbl.indexOf("@codefast") >= 0 && scenarioRow && globalIx !== undefined) {
              const f = scenarioRow.codefastIqrFraction[globalIx];
              if (typeof f === "number" && Number.isFinite(f))
                extra = " · IQR " + (f * 100).toFixed(1) + "%";
            }
            if (
              lbl.indexOf("inversify") >= 0 &&
              lbl.indexOf("P") < 0 &&
              scenarioRow &&
              globalIx !== undefined
            ) {
              const f = scenarioRow.inversifyIqrFraction[globalIx];
              if (typeof f === "number" && Number.isFinite(f))
                extra = " · IQR " + (f * 100).toFixed(1) + "%";
            }
            return (
              lbl + ": " + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) + extra
            );
          },
        },
      },
    };
    if (typeof ChartZoom !== "undefined") {
      pluginsMerged.zoom = {
        pan: { enabled: true, mode: "x" },
        zoom: {
          wheel: { enabled: true, modifierKey: "ctrl" },
          pinch: { enabled: true },
          mode: "x",
          drag: { enabled: false },
        },
        limits: {},
      };
    }

    var layoutPadRight = 12 + (showRatio.checked ? 20 : 0);
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: scales,
      plugins: pluginsMerged,
      layout: {
        padding: { top: 4, right: layoutPadRight, bottom: 2, left: 12 },
      },
    };

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("bench-chart"), {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: options,
    });

    /**
     * Default view: show ~the last half of runs (capped) so the newest points are not
     * squeezed at the chart edge; use Reset zoom for the full timeline.
     * Category offset option adds half-step margin at both ends of the x axis.
     */
    function applyInitialRecentFocus() {
      if (!chart || typeof chart.zoomScale !== "function") {
        return;
      }
      var L = chart.data.labels ? chart.data.labels.length : 0;
      if (L < 6) {
        return;
      }
      var lastIx = L - 1;
      var span = Math.min(
        Math.max(Math.floor(L * 0.5), 18),
        Math.min(56, lastIx + 1),
      );
      var minIx = Math.max(0, lastIx - span + 1);
      chart.zoomScale("x", { min: minIx, max: lastIx }, "none");
    }
    applyInitialRecentFocus();

    scheduleChartResize();
  }

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", function () {
      if (!chart || typeof chart.zoom !== "function") return;
      chart.zoom({ x: ZOOM_STEP_X }, "none");
      scheduleChartResize();
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", function () {
      if (!chart || typeof chart.zoom !== "function") return;
      chart.zoom({ x: 1 / ZOOM_STEP_X }, "none");
      scheduleChartResize();
    });
  }
  if (btnPanEarlier) {
    btnPanEarlier.addEventListener("click", function () {
      if (!chart || typeof chart.pan !== "function") return;
      chart.pan({ x: PAN_PIXELS_X }, undefined, "none");
      scheduleChartResize();
    });
  }
  if (btnPanLater) {
    btnPanLater.addEventListener("click", function () {
      if (!chart || typeof chart.pan !== "function") return;
      chart.pan({ x: -PAN_PIXELS_X }, undefined, "none");
      scheduleChartResize();
    });
  }
  if (btnResetZoom) {
    btnResetZoom.addEventListener("click", function () {
      if (!chart || typeof chart.resetZoom !== "function") return;
      chart.resetZoom();
      scheduleChartResize();
    });
  }
  if (btnDownload) {
    btnDownload.addEventListener("click", function () {
      if (!chart || typeof chart.toBase64Image !== "function") return;
      var sid = String(scenarioSelect.value || "chart").replace(/[^a-zA-Z0-9_.-]+/g, "_");
      var a = document.createElement("a");
      a.download = "bench-history-" + sid + ".png";
      a.href = chart.toBase64Image("image/png", 1);
      a.click();
    });
  }
  scenarioSelect.addEventListener("change", render);
  scenarioSearch.addEventListener("input", function () {
    fillScenarioOptions();
    render();
  });
  groupFilter.addEventListener("change", function () {
    fillScenarioOptions();
    render();
  });
  envFilter.addEventListener("change", function () {
    refreshEnvironmentBannerVisibility();
    render();
  });
  showBands.addEventListener("change", render);
  logScale.addEventListener("change", render);
  showRatio.addEventListener("change", render);
  render();
})();
  </script>
</body>
</html>
`;
}

function main(): void {
  const benchResultsDirectory = join(packageRootDirectory, "bench-results");
  const runs = listHistoricalRuns(benchResultsDirectory);
  if (runs.length === 0) {
    console.error(
      "No run directories with observations.jsonl found under bench-results/. Run `pnpm bench` first.",
    );
    process.exitCode = 1;
    return;
  }
  const payload = buildEmbeddedPayload(runs);
  const outputPath = join(benchResultsDirectory, "history-viewer.html");
  writeFileSync(outputPath, renderHtml(payload), "utf8");
  console.log(
    `Wrote ${outputPath} (${String(runs.length)} runs, ${String(payload.scenarios.length)} scenarios). Open in a browser.`,
  );
}

main();
