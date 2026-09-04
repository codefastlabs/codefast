import { quantile, sortAscending } from "@codefast/benchmark-harness/report/quantiles";
import { NOISY_IQR_FRACTION } from "@codefast/benchmark-harness/report/reliability";

import type { PaletteEntry } from "#/app/lib/colors";
import { DISPERSION_IQR_ALERT } from "#/app/lib/constants";
import { fmtHz, fmtPctChange, fmtRatio, formatLocal } from "#/app/lib/format";
import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries } from "#/types";

/**
 * How loud a library's worst per-trial IQR is, tiered on the harness's noise thresholds.
 *
 * @since 0.3.16-canary.3
 */
export type IqrSeverity = "ok" | "noisy" | "high";

/**
 * Returns the median of the finite positive numbers in a list, or null when none remain.
 *
 * @remarks Delegates to the harness quantile, so the cards agree with the plotted median bands.
 *
 * @since 0.3.16-canary.1
 */
export function medianNumeric(values: Array<number | null | undefined>): number | null {
  const positiveValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  return positiveValues.length === 0 ? null : quantile(sortAscending(positiveValues), 0.5);
}

/**
 * Picks the scenario with the richest history — most libraries with data, then most runs with
 * data — so the landing view opens on a chart worth reading.
 */
export function pickDefaultScenarioId(scenarios: ReadonlyArray<EmbeddedScenarioSeries>): string {
  let bestId = "";
  let bestLibraryCount = -1;
  let bestRunCount = -1;
  for (const scenario of scenarios) {
    const seriesList = Object.values(scenario.libraries);
    const libraryCount = seriesList.filter((series) => series.hz.some((hz) => hz !== null)).length;
    let runCount = 0;
    const runTotal = seriesList[0]?.hz.length ?? 0;
    for (let runIx = 0; runIx < runTotal; runIx++) {
      if (seriesList.some((series) => series.hz[runIx] !== null)) {
        runCount++;
      }
    }
    if (libraryCount > bestLibraryCount || (libraryCount === bestLibraryCount && runCount > bestRunCount)) {
      bestId = scenario.id;
      bestLibraryCount = libraryCount;
      bestRunCount = runCount;
    }
  }
  return bestId;
}

/**
 * Returns the ratio of two hz values, or null when either is missing or non-positive.
 *
 * @since 0.3.16-canary.1
 */
export function ratioFrom(
  numeratorHz: number | null | undefined,
  denominatorHz: number | null | undefined,
): number | null {
  return typeof numeratorHz === "number" && typeof denominatorHz === "number" && numeratorHz > 0 && denominatorHz > 0
    ? numeratorHz / denominatorHz
    : null;
}

function collectHzValues(hz: ReadonlyArray<number | null>, indices: ReadonlyArray<number>): Array<number> {
  return indices
    .map((globalIx) => hz[globalIx])
    .filter((hzValue): hzValue is number => typeof hzValue === "number" && hzValue > 0);
}

function maxIqrFraction(iqrFraction: ReadonlyArray<number | null>, indices: ReadonlyArray<number>): number {
  let max = 0;
  for (const globalIx of indices) {
    const iqrFractionAtRun = iqrFraction[globalIx];
    if (typeof iqrFractionAtRun === "number" && Number.isFinite(iqrFractionAtRun)) {
      max = Math.max(max, iqrFractionAtRun);
    }
  }
  return max;
}

/**
 * Discriminated union describing one line inside a MetricCard.
 * Components in the presentation layer switch on `type` to render each variant.
 *
 * @since 0.3.16-canary.1
 */
export type MetaItem =
  | { type: "range"; minHz: number; maxHz: number }
  | { type: "text"; value: string }
  | { type: "fine-text"; value: string }
  | { type: "ratio-paired"; value: string }
  | { type: "iqr-table"; rows: Array<{ libName: string; iqrLabel: string; severity: IqrSeverity }> };

/**
 * The label, value, meta lines, and accent styling one MetricCard renders.
 *
 * @since 0.3.16-canary.1
 */
export interface MetricCardProps {
  label: string;
  value: string;
  meta: Array<MetaItem>;
  accentColor?: string | undefined;
  isRatio?: boolean;
}

/**
 * The metric cards, dispersion flag, and footnote built for the selected scenario.
 *
 * @since 0.3.16-canary.1
 */
export interface MetricsResult {
  cards: Array<MetricCardProps>;
  hasHighDispersion: boolean;
  footnote: string;
}

/**
 * One scenario's row in the latest-measurement snapshot table: hz cells, ratio cells, and the
 * local date of the newest contributing run.
 *
 * @since 0.3.16-canary.1
 */
export interface SnapshotRow {
  id: string;
  group: string;
  hzCells: Array<string>;
  ratioCells: Array<string>;
  asOf: string;
}

/**
 * The scenario, run filters, and library ordering buildMetrics summarises from.
 *
 * @since 0.3.16-canary.3
 */
export interface BuildMetricsOptions {
  scenario: EmbeddedScenarioSeries;
  /** The runs on the chart — only runs with data for the scenario. */
  runIndices: Array<number>;
  /** Runs the window kept before the no-data filter, for the "Runs shown" footnote. */
  windowedRunCount: number;
  /** Libraries with no data in this view, named in the footnote instead of rendering dead cards. */
  inactiveLibraryNames: ReadonlyArray<string>;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  primaryLib: EmbeddedLibraryMeta | undefined;
  compareLibs: Array<EmbeddedLibraryMeta>;
  baseRunIndices: Array<number>;
  envKey: string;
  runWindow: string;
}

/**
 * Builds the metric cards, dispersion flag, and footnote for one scenario's filtered runs.
 *
 * @since 0.3.16-canary.1
 */
export function buildMetrics({
  scenario,
  runIndices,
  windowedRunCount,
  inactiveLibraryNames,
  orderedLibraries,
  paletteMap,
  primaryLib,
  compareLibs,
  baseRunIndices,
  envKey,
  runWindow,
}: BuildMetricsOptions): MetricsResult {
  const cards: Array<MetricCardProps> = [];
  let worstIqr = 0;

  for (const lib of orderedLibraries) {
    const libData = scenario.libraries[lib.key];
    if (!libData) {
      continue;
    }
    const color = paletteMap[lib.key]?.text;
    const hzValues = collectHzValues(libData.hz, runIndices);

    const median = medianNumeric(hzValues);
    const minHz = hzValues.length ? hzValues.reduce((min, hz) => (hz < min ? hz : min)) : null;
    const maxHz = hzValues.length ? hzValues.reduce((max, hz) => (hz > max ? hz : max)) : null;

    const hzAtOldest = runIndices[0] !== undefined ? (libData.hz[runIndices[0]] ?? null) : null;
    const hzAtNewest =
      runIndices[runIndices.length - 1] !== undefined ? (libData.hz[runIndices[runIndices.length - 1]!] ?? null) : null;

    let trend = "—";
    if (
      runIndices.length >= 2 &&
      typeof hzAtOldest === "number" &&
      hzAtOldest > 0 &&
      typeof hzAtNewest === "number" &&
      hzAtNewest > 0
    ) {
      trend = fmtPctChange(hzAtOldest, hzAtNewest) + ", oldest → newest run in filter";
    }

    const runsWithData = hzValues.length;
    const runsPlotted = runIndices.length;

    worstIqr = Math.max(worstIqr, maxIqrFraction(libData.iqrFraction, runIndices));

    const meta: Array<MetaItem> = [];
    if (minHz !== null && maxHz !== null) {
      meta.push({ type: "range", minHz, maxHz });
    }
    meta.push({ type: "text", value: `Δ ${trend}` });
    if (runsWithData < runsPlotted) {
      meta.push({
        type: "fine-text",
        value: `${runsWithData} of ${runsPlotted} plotted runs have median hz/op`,
      });
    }

    cards.push({
      label: `${lib.displayName} median hz/op`,
      value: median !== null ? `${fmtHz(median)} Hz/op` : "—",
      meta,
      accentColor: color,
    });
  }

  // Ratio cards — only when the primary itself has data here, so no card can read "— ÷ —".
  if (primaryLib && orderedLibraries.some((lib) => lib.key === primaryLib.key)) {
    for (const cmpLib of compareLibs) {
      const primData = scenario.libraries[primaryLib.key];
      const cmpData = scenario.libraries[cmpLib.key];
      if (!primData || !cmpData) {
        continue;
      }

      const primHzVals = collectHzValues(primData.hz, runIndices);
      const cmpHzVals = collectHzValues(cmpData.hz, runIndices);
      const primMed = medianNumeric(primHzVals);
      const cmpMed = medianNumeric(cmpHzVals);
      const ratioMedians = ratioFrom(primMed, cmpMed);
      const runRatios = runIndices
        .map((globalIx) => ratioFrom(primData.hz[globalIx], cmpData.hz[globalIx]))
        .filter((ratio): ratio is number => ratio !== null);
      const medianOfRunRatios = medianNumeric(runRatios);
      const showPaired =
        medianOfRunRatios !== null &&
        ratioMedians !== null &&
        Math.abs(medianOfRunRatios - ratioMedians) / ratioMedians > 0.002;

      const meta: Array<MetaItem> = [
        {
          type: "text",
          value: "Median ÷ median for this filter; each side uses runs with hz/op for that library.",
        },
      ];
      if (showPaired && medianOfRunRatios !== null) {
        meta.push({ type: "ratio-paired", value: medianOfRunRatios.toFixed(3) });
      }

      cards.push({
        label: `Ratio · ${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
        value: fmtRatio(ratioMedians),
        meta,
        isRatio: true,
      });
    }
  }

  // IQR card
  const iqrRows = orderedLibraries.map((lib) => {
    const libData = scenario.libraries[lib.key];
    let iqrLabel = "—";
    let severity: IqrSeverity = "ok";
    if (libData) {
      const maxIqr = maxIqrFraction(libData.iqrFraction, runIndices);
      if (maxIqr > 0) {
        iqrLabel = `${(maxIqr * 100).toFixed(1)}%`;
        severity = maxIqr > DISPERSION_IQR_ALERT ? "high" : maxIqr > NOISY_IQR_FRACTION ? "noisy" : "ok";
      }
    }
    return { libName: lib.displayName, iqrLabel, severity };
  });

  cards.push({
    label: "Worst IQR÷median · per plotted run",
    value: "",
    meta: [{ type: "iqr-table", rows: iqrRows }],
  });

  const footPieces: Array<string> = [
    `${runIndices.length} run(s) on the chart${envKey ? "; environment filter on" : "; all environments"}. Median & range: all filtered runs with hz/op. Δ: % change from first → last run in this view when both have data`,
  ];
  if (runWindow !== "all" && windowedRunCount < baseRunIndices.length) {
    footPieces.push(
      `Runs shown: last ${windowedRunCount} of ${baseRunIndices.length} runs matching Environment + search/group filters`,
    );
  }
  if (inactiveLibraryNames.length > 0) {
    footPieces.push(`No data in this view: ${inactiveLibraryNames.join(", ")}`);
  }
  if (worstIqr > DISPERSION_IQR_ALERT) {
    footPieces.push(
      `elevated per-trial dispersion (IQR above ${DISPERSION_IQR_ALERT * 100}% of median) on ≥1 plotted run — inspect tooltip IQR%`,
    );
  }

  return {
    cards,
    hasHighDispersion: worstIqr > DISPERSION_IQR_ALERT,
    footnote: footPieces.join(". ") + ".",
  };
}

/**
 * Builds one scenario's snapshot-table row from each library's newest run with data.
 *
 * @remarks Runs are dominated by narrowed suites, so the last run directory rarely covers a given
 * scenario — cells therefore use per-library latest values, and the ratio may pair different runs.
 *
 * @since 0.3.16-canary.1
 */
export function buildSnapshotRow(
  scenario: EmbeddedScenarioSeries,
  runs: ReadonlyArray<EmbeddedRun>,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
): SnapshotRow {
  const libHzMap: Record<string, number | null> = {};
  const hzCells: Array<string> = [];
  let newestDataIx = -1;
  for (const lib of orderedLibraries) {
    const hzSeries = scenario.libraries[lib.key]?.hz ?? [];
    let latestHz: number | null = null;
    for (let runIx = hzSeries.length - 1; runIx >= 0; runIx--) {
      const hz = hzSeries[runIx];
      if (typeof hz === "number" && hz > 0) {
        latestHz = hz;
        newestDataIx = Math.max(newestDataIx, runIx);
        break;
      }
    }
    libHzMap[lib.key] = latestHz;
    hzCells.push(fmtHz(latestHz));
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;
  const ratioCells: Array<string> = compareLibs.map((cmp) => fmtRatio(ratioFrom(primaryHz, libHzMap[cmp.key] ?? null)));
  const newestRun = newestDataIx >= 0 ? runs[newestDataIx] : undefined;

  return {
    id: scenario.id,
    group: scenario.group,
    hzCells,
    ratioCells,
    asOf: newestRun ? formatLocal(newestRun.timestampIso, newestRun.folder) : "—",
  };
}
