#!/usr/bin/env node
/**
 * Builds a self-contained HTML chart from every run under `bench-results/<timestamp>/observations.jsonl`.
 * Open `bench-results/history-viewer.html` in a browser (file:// is fine).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LibraryReport } from "#/harness/report";
import { buildLibraryReport } from "#/harness/report";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/harness/protocol";

const CODEFAST_LIBRARY = "@codefast/di";
const INVERSIFY_LIBRARY = "inversify";

interface BenchObservationLine {
  readonly timestampIso: string;
  readonly libraryName: string;
  readonly libraryVersion: string;
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly nodeOptions: string;
  readonly gcExposed: boolean;
  readonly trialIndex: number;
  readonly scenarioId: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly hzPerIteration: number;
  readonly hzPerOp: number;
  readonly meanMs: number;
  readonly p75Ms: number;
  readonly p99Ms: number;
  readonly p999Ms: number;
  readonly samples: number;
}

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

function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((left, right) => left - right);
}

/**
 * Matches `report.ts` (NumPy linear default) so P25–P75 bands match the harness.
 */
function quantile(sortedValues: readonly number[], q: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0] ?? 0;
  }
  const position = q * (sortedValues.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sortedValues[lowerIndex] ?? 0;
  const upper = sortedValues[upperIndex] ?? 0;
  if (lowerIndex === upperIndex) {
    return lower;
  }
  const fraction = position - lowerIndex;
  return lower + (upper - lower) * fraction;
}

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
    const observation = JSON.parse(line) as BenchObservationLine;
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

function observationToFingerprint(observation: BenchObservationLine): Fingerprint {
  return {
    nodeVersion: observation.nodeVersion,
    v8Version: observation.v8Version,
    platform: observation.platform,
    arch: observation.arch,
    cpuModel: observation.cpuModel,
    cpuCount: observation.cpuCount,
    nodeOptions: observation.nodeOptions,
    gcExposed: observation.gcExposed,
    libraryName: observation.libraryName,
    libraryVersion: observation.libraryVersion,
    timestampIso: observation.timestampIso,
  };
}

function observationToScenarioResult(observation: BenchObservationLine): ScenarioTrialResult {
  return {
    id: observation.scenarioId,
    group: observation.group,
    stress: observation.stress,
    batch: observation.batch,
    what: observation.what,
    hzPerIteration: observation.hzPerIteration,
    hzPerOp: observation.hzPerOp,
    meanMs: observation.meanMs,
    p75Ms: observation.p75Ms,
    p99Ms: observation.p99Ms,
    p999Ms: observation.p999Ms,
    samples: observation.samples,
  };
}

function jsonlToLibraryReport(
  lines: readonly string[],
  libraryName: string,
): LibraryReport | undefined {
  const observations: BenchObservationLine[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const parsed = JSON.parse(line) as BenchObservationLine;
    if (parsed.libraryName === libraryName) {
      observations.push(parsed);
    }
  }
  if (observations.length === 0) {
    return undefined;
  }
  const fingerprint = observationToFingerprint(observations[0]!);
  const byTrialIndex = new Map<number, ScenarioTrialResult[]>();
  for (const observation of observations) {
    const result = observationToScenarioResult(observation);
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
  let codefastObservation: BenchObservationLine | undefined;
  let inversifyObservation: BenchObservationLine | undefined;
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const observation = JSON.parse(line) as BenchObservationLine;
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
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js" crossorigin="anonymous"></script>
</head>
<body class="min-h-screen bg-zinc-950 font-sans text-zinc-200 antialiased">
  <div class="mx-auto max-w-7xl px-4 pb-12 pt-5">
    <h1 class="mb-1.5 text-xl font-semibold text-zinc-100">Benchmark history — hz/op median per run</h1>
    <p class="max-w-3xl text-[0.95rem] leading-relaxed text-zinc-300/90">Medians and P25–P75 bands use the same quantile rules as <code class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.88em] text-indigo-200">report.ts</code> (across trials). Shaded bands show spread of per-trial hz/op; use IQR% in the tooltip to spot noisy runs. Filter by environment when you mixed machines or Node versions. The X axis and tooltips show each run’s time in <strong class="font-medium text-zinc-200">your browser’s local timezone</strong> (stored runs use UTC <code class="font-mono text-indigo-200/90">timestampIso</code>).</p>
    <div class="mt-5 mb-4 flex flex-wrap items-end gap-x-6 gap-y-4">
    <label class="block shrink-0">
      <span class="mb-1 block text-[0.82rem] text-zinc-400">Search scenario</span>
      <input type="search" id="scenario-search" placeholder="Filter by name…" autocomplete="off" class="min-w-48 max-w-xs rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </label>
    <label class="block shrink-0">
      <span class="mb-1 block text-[0.82rem] text-zinc-400">Scenario</span>
      <select id="scenario-select" aria-label="Benchmark scenario" class="min-w-72 max-w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"></select>
    </label>
    <label class="block shrink-0">
      <span class="mb-1 block text-[0.82rem] text-zinc-400">Group</span>
      <select id="group-filter" aria-label="Filter by group" class="min-w-[10rem] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"><option value="">All groups</option></select>
    </label>
    <label class="block shrink-0">
      <span class="mb-1 block text-[0.82rem] text-zinc-400">Environment</span>
      <select id="env-filter" aria-label="Filter runs by CPU and Node" class="max-w-[22rem] min-w-[14rem] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"><option value="">All runs</option></select>
    </label>
  </div>
  <div class="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.88rem] text-zinc-300">
    <label class="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" id="show-bands" checked class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" /> P25–P75 band (per-trial hz/op)</label>
    <label class="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" id="log-scale" class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" /> Logarithmic Y axis</label>
    <label class="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" id="show-ratio" class="rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500" /> codefast ÷ inversify (right axis)</label>
  </div>
  <div id="summary" aria-live="polite" class="mb-4 rounded-lg border border-zinc-700/90 bg-zinc-900/80 px-3.5 py-2.5 text-sm leading-snug text-zinc-200 [&_strong]:font-semibold [&_strong]:text-zinc-100"></div>
  <div class="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
    <span class="text-zinc-500">Chart:</span>
    <button type="button" id="chart-zoom-in" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Zoom in (time axis)">Zoom +</button>
    <button type="button" id="chart-zoom-out" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Zoom out (time axis)">Zoom −</button>
    <button type="button" id="chart-pan-earlier" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Earlier runs (←)">← Earlier</button>
    <button type="button" id="chart-pan-later" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80" title="Later runs (→)">Later →</button>
    <button type="button" id="chart-reset-zoom" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80">Reset zoom</button>
    <button type="button" id="chart-download-png" class="rounded-md border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/80">Download PNG</button>
    <span class="text-xs text-zinc-500">Default shows recent portion (offset eases edges) · Reset zoom for full range · drag / wheel · legend toggles series</span>
  </div>
  <div id="chart-host" class="relative h-[min(440px,64vh)] w-full min-h-[280px]"><canvas id="bench-chart" aria-label="Throughput over time chart" class="block h-full w-full"></canvas></div>
  <hr class="my-8 border-zinc-800" />
  <section class="mb-8" aria-labelledby="latest-bars-heading">
    <h2 id="latest-bars-heading" class="mb-2 text-xl font-semibold text-zinc-100">Latest run — throughput by scenario</h2>
    <p id="latest-bars-meta" class="mb-3 text-sm leading-relaxed text-zinc-300"></p>
    <p id="latest-bars-empty" class="mb-3 hidden text-sm text-zinc-500"></p>
    <div id="latest-bars-host" class="relative w-full rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2" style="min-height:220px;">
      <canvas id="bench-latest-bars" aria-label="Latest run bar chart comparing libraries per scenario" class="block h-full w-full"></canvas>
    </div>
  </section>
  <p class="mt-3 text-[0.78rem] text-zinc-500">Generated locally — <code class="rounded bg-zinc-900 px-1 py-px font-mono text-[0.85em] text-indigo-200">pnpm bench:history</code> · ${escapeHtml(runCount)} runs · ${escapeHtml(scenarioCount)} scenarios</p>
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
  const summaryEl = document.getElementById("summary");
  const btnResetZoom = document.getElementById("chart-reset-zoom");
  const btnDownload = document.getElementById("chart-download-png");
  const btnZoomIn = document.getElementById("chart-zoom-in");
  const btnZoomOut = document.getElementById("chart-zoom-out");
  const btnPanEarlier = document.getElementById("chart-pan-earlier");
  const btnPanLater = document.getElementById("chart-pan-later");
  const latestBarsMetaEl = document.getElementById("latest-bars-meta");
  const latestBarsEmptyEl = document.getElementById("latest-bars-empty");
  const latestBarsHostEl = document.getElementById("latest-bars-host");

  var ZOOM_STEP_X = 1.15;
  var PAN_PIXELS_X = 120;
  if (typeof Chart !== "undefined" && typeof ChartZoom !== "undefined") {
    Chart.register(ChartZoom);
  }

  /**
   * Horizontal grouped bars: anchor tooltip to the category row (vertical axis), not to pointer X on the value axis.
   */
  if (typeof Chart !== "undefined" && Chart.Tooltip && Chart.Tooltip.positioners) {
    Chart.Tooltip.positioners.latestBarRowAligned = function latestBarRowAlignedTooltip(
      elements,
      eventPosition,
    ) {
      var tooltip = this;
      var chart = tooltip && tooltip.chart;
      var area = chart && chart.chartArea;
      if (!area) {
        if (!eventPosition) return false;
        return { x: eventPosition.x, y: eventPosition.y };
      }
      var y =
        eventPosition && typeof eventPosition.y === "number"
          ? eventPosition.y
          : (area.top + area.bottom) / 2;
      if (elements && elements.length > 0) {
        var ySum = 0;
        var yCount = 0;
        for (var ei = 0; ei < elements.length; ei++) {
          var raw = elements[ei] && elements[ei].element;
          if (!raw) continue;
          var vy;
          if (typeof raw.getCenterPoint === "function") {
            var center = raw.getCenterPoint();
            if (center && typeof center.y === "number") {
              vy = center.y;
            }
          } else if (typeof raw.y === "number" && typeof raw.height === "number") {
            vy = raw.y + raw.height / 2;
          }
          if (typeof vy === "number") {
            ySum += vy;
            yCount++;
          }
        }
        if (yCount > 0) {
          y = ySum / yCount;
        }
      }
      var x = area.left + area.width / 2;
      return { x: x, y: y, xAlign: "center", yAlign: "center" };
    };
  }

  let chart = null;
  let latestBarsChart = null;
  let resizeScheduled = false;
  function scheduleChartResize() {
    if ((!chart && !latestBarsChart) || resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(function () {
      resizeScheduled = false;
      if (chart) chart.resize();
      if (latestBarsChart) latestBarsChart.resize();
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

  function renderLatestBarSnapshot() {
    var canvas = document.getElementById("bench-latest-bars");
    if (!canvas || !latestBarsMetaEl || !latestBarsEmptyEl || !latestBarsHostEl) {
      return;
    }
    if (latestBarsChart) {
      latestBarsChart.destroy();
      latestBarsChart = null;
    }
    var lastIx = data.runs.length > 0 ? data.runs.length - 1 : -1;
    if (lastIx < 0) {
      latestBarsMetaEl.textContent = "";
      latestBarsEmptyEl.classList.remove("hidden");
      latestBarsEmptyEl.textContent = "No runs in history.";
      latestBarsHostEl.style.display = "none";
      return;
    }
    var runInfo = data.runs[lastIx];

    var paired = [];
    var sList = data.scenarios;
    for (var si = 0; si < sList.length; si++) {
      var s = sList[si];
      var cf = s.codefast[lastIx];
      var iv = s.inversify[lastIx];
      var hasCf = typeof cf === "number" && cf > 0;
      var hasIv = typeof iv === "number" && iv > 0;
      if (!hasCf && !hasIv) continue;
      paired.push({
        label: "[" + s.group + "] " + s.id,
        group: s.group,
        scenarioId: s.id,
        codefast: hasCf ? cf : null,
        inversify: hasIv ? iv : null,
      });
    }
    paired.sort(function (a, b) {
      var g = a.group.localeCompare(b.group);
      if (g !== 0) return g;
      return a.scenarioId.localeCompare(b.scenarioId);
    });

    var metaLine =
      "Latest saved run · " +
      formatBenchRunInstantLocal(runInfo.timestampIso, runInfo.folder) +
      " (local) · " +
      runInfo.envLabel +
      " · Node " +
      runInfo.nodeVersion +
      " · @codefast/di " +
      runInfo.codefastVersion +
      " · inversify " +
      runInfo.inversifyVersion;
    latestBarsMetaEl.textContent = metaLine;

    if (paired.length === 0) {
      latestBarsEmptyEl.classList.remove("hidden");
      latestBarsEmptyEl.textContent =
        "No scenario throughput data for the latest saved run.";
      latestBarsHostEl.style.display = "";
      latestBarsHostEl.style.height = "180px";
      return;
    }

    latestBarsEmptyEl.classList.add("hidden");
    latestBarsEmptyEl.textContent = "";
    latestBarsHostEl.style.display = "";
    var labels = paired.map(function (r) {
      return r.label;
    });
    var cfs = paired.map(function (r) {
      return r.codefast;
    });
    var invs = paired.map(function (r) {
      return r.inversify;
    });
    var pxPerRow = paired.length <= 12 ? 42 : paired.length <= 24 ? 34 : 28;
    latestBarsHostEl.style.height = Math.min(1120, paired.length * pxPerRow + 120) + "px";

    latestBarsChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "@codefast/di hz/op (median)",
            data: cfs,
            backgroundColor: "rgba(110,231,197,0.55)",
            borderColor: "#6ee7c5",
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: "inversify hz/op (median)",
            data: invs,
            backgroundColor: "rgba(147,180,255,0.48)",
            borderColor: "#93b4ff",
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        layout: { padding: { left: 6, right: 8, bottom: 4 } },
        interaction: { mode: "index", intersect: false, axis: "y" },
        datasets: {
          bar: { categoryPercentage: 0.78, barPercentage: 0.9 },
        },
        scales: {
          x: {
            type: "logarithmic",
            title: {
              display: true,
              text: "Throughput hz/op (median) — log axis",
              color: "#bdbdbd",
              font: { size: 14, weight: "600" },
            },
            grid: { color: "#2c2c36" },
            ticks: {
              color: "#bdbdbd",
              font: { size: 13 },
              callback: function (v) {
                if (typeof v !== "number" || v <= 0) return "";
                if (v >= 1e12) return Number(v).toExponential(1);
                return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
              },
            },
          },
          y: {
            ticks: {
              color: "#d4d4d8",
              font: { size: 13 },
              autoSkip: false,
              maxRotation: 0,
            },
            grid: { color: "#25252d" },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#e4e4e7",
              boxWidth: 16,
              padding: 14,
              font: { size: 14 },
            },
          },
          tooltip: {
            position:
              Chart.Tooltip && Chart.Tooltip.positioners && Chart.Tooltip.positioners.latestBarRowAligned
                ? "latestBarRowAligned"
                : "nearest",
            titleFont: { size: 15, weight: "600" },
            bodyFont: { size: 14 },
            footerFont: { size: 13 },
            padding: 12,
            caretPadding: 4,
            callbacks: {
              title: function (tipItems) {
                if (!tipItems.length) return "";
                var row = paired[tipItems[0].dataIndex];
                return row ? row.scenarioId : "";
              },
              label: function (ctx) {
                var v = ctx.raw;
                var piece =
                  v === null || v === undefined ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 });
                return (ctx.dataset.label || "").replace(" (median)", "") + ": " + piece;
              },
              footer: function (tipItems) {
                if (!tipItems.length) return "";
                var ix = tipItems[0].dataIndex;
                var a = cfs[ix];
                var b = invs[ix];
                if (typeof a !== "number" || typeof b !== "number" || a <= 0 || b <= 0) return "";
                return "@codefast/di ÷ inversify throughput ratio: " + (a / b).toFixed(3) + "×";
              },
            },
          },
        },
      },
    });
    scheduleChartResize();
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

  function updateSummary(row, indices) {
    if (!row || indices.length < 1) {
      summaryEl.textContent = "";
      return;
    }
    const cf = indices.map(function (i) { return row.codefast[i]; }).filter(function (v) { return typeof v === "number" && v > 0; });
    const iv = indices.map(function (i) { return row.inversify[i]; }).filter(function (v) { return typeof v === "number" && v > 0; });
    const parts = [];
    if (row.what) parts.push("<strong>" + row.id + "</strong> — " + row.what);
    else parts.push("<strong>" + row.id + "</strong>");
    if (cf.length >= 2) {
      parts.push("@codefast/di: first " + fmtHz(cf[0]) + " → last " + fmtHz(cf[cf.length - 1]) + " hz/op (" + fmtPctChange(cf[0], cf[cf.length - 1]) + " vs first visible point)");
    } else if (cf.length === 1) {
      parts.push("@codefast/di: " + fmtHz(cf[0]) + " hz/op (single visible point)");
    }
    if (iv.length >= 2) {
      parts.push("inversify: first " + fmtHz(iv[0]) + " → last " + fmtHz(iv[iv.length - 1]) + " hz/op (" + fmtPctChange(iv[0], iv[iv.length - 1]) + ")");
    } else if (iv.length === 1) {
      parts.push("inversify: " + fmtHz(iv[0]) + " hz/op (single visible point)");
    }
    parts.push("Visible runs: " + indices.length + (envFilter.value ? " (environment filter on)" : "") + ".");
    summaryEl.innerHTML = parts.join("<br/>");
  }

  function render() {
    const id = scenarioSelect.value;
    const row = data.scenarios.find(function (s) { return s.id === id; });
    const indices = filteredRunIndices();
    if (!row || indices.length === 0) {
      if (chart) chart.destroy();
      chart = null;
      summaryEl.textContent = "No runs match the environment filter.";
      return;
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

    updateSummary(row, indices);

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
          wheel: { enabled: true },
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
  envFilter.addEventListener("change", render);
  showBands.addEventListener("change", render);
  logScale.addEventListener("change", render);
  showRatio.addEventListener("change", render);
  renderLatestBarSnapshot();
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
