import type { PaletteEntry } from "#/client/lib/colors";
import { DISPERSION_IQR_ALERT } from "#/client/lib/constants";
import { fmtHz, fmtPctChange } from "#/client/lib/format";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/server-types";

/**
 * @since 0.3.16-canary.1
 */
export function medianNumeric(values: Array<number | null | undefined>): number | null {
  const sorted = values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (sorted.length === 0) {
    return null;
  }
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * @since 0.3.16-canary.1
 */
export function ratioFrom(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  return typeof a === "number" && typeof b === "number" && a > 0 && b > 0 ? a / b : null;
}

function collectHzValues(
  hz: ReadonlyArray<number | null>,
  indices: ReadonlyArray<number>,
): Array<number> {
  return indices.map((gx) => hz[gx]).filter((v): v is number => typeof v === "number" && v > 0);
}

function maxIqrFraction(
  iqrFraction: ReadonlyArray<number | null>,
  indices: ReadonlyArray<number>,
): number {
  let max = 0;
  for (const gx of indices) {
    const f = iqrFraction[gx];
    if (typeof f === "number" && Number.isFinite(f)) {
      max = Math.max(max, f);
    }
  }
  return max;
}

/**
 * @since 0.3.16-canary.1
 */
export interface MetricCardProps {
  label: string;
  value: string;
  meta: Array<string>;
  accentColor?: string;
  isRatio?: boolean;
}

/**
 * @since 0.3.16-canary.1
 */
export interface MetricsResult {
  cards: Array<MetricCardProps>;
  hasHighDispersion: boolean;
  footnote: string;
}

/**
 * @since 0.3.16-canary.1
 */
export interface SnapshotRow {
  id: string;
  group: string;
  hzCells: Array<string>;
  ratioCells: Array<string>;
}

/**
 * @since 0.3.16-canary.1
 */
export function buildMetrics(
  scenario: EmbeddedScenarioSeries,
  runIndices: Array<number>,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  paletteMap: Record<string, PaletteEntry>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
  baseRunIndices: Array<number>,
  envKey: string,
  runWindow: string,
): MetricsResult {
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
    const lo = hzValues.length ? hzValues.reduce((a, b) => (a < b ? a : b)) : null;
    const hi = hzValues.length ? hzValues.reduce((a, b) => (a > b ? a : b)) : null;

    const hzAtOldest = runIndices[0] !== undefined ? (libData.hz[runIndices[0]] ?? null) : null;
    const hzAtNewest =
      runIndices[runIndices.length - 1] !== undefined
        ? (libData.hz[runIndices[runIndices.length - 1]!] ?? null)
        : null;

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

    const meta: Array<string> = [];
    if (lo !== null && hi !== null) {
      meta.push(`<span class="bh-metric__meta--mono">Range ${fmtHz(lo)} … ${fmtHz(hi)}</span>`);
    }
    meta.push(`Δ ${trend}`);
    if (runsWithData < runsPlotted) {
      meta.push(
        `<span class="bh-metric__meta--fine">${runsWithData} of ${runsPlotted} plotted runs have median hz/op</span>`,
      );
    }

    cards.push({
      label: `${lib.displayName} median hz/op`,
      value: median !== null ? `${fmtHz(median)} Hz/op` : "—",
      meta,
      accentColor: color,
    });
  }

  // Ratio cards
  if (primaryLib) {
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
        .map((gx) => ratioFrom(primData.hz[gx], cmpData.hz[gx]))
        .filter((v): v is number => v !== null);
      const medianOfRunRatios = medianNumeric(runRatios);
      const showPaired =
        medianOfRunRatios !== null &&
        ratioMedians !== null &&
        Math.abs(medianOfRunRatios - ratioMedians) / ratioMedians > 0.002;

      const meta = [
        "Median ÷ median for this filter; each side uses runs with hz/op for that library.",
      ];
      if (showPaired) {
        meta.push(
          `Median of per-run ratios · <span class="bh-metric__fig">${medianOfRunRatios!.toFixed(3)}×</span>`,
        );
      }

      cards.push({
        label: `Ratio · ${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
        value: ratioMedians !== null ? `${ratioMedians.toFixed(3)}×` : "—",
        meta,
        isRatio: true,
      });
    }
  }

  // IQR card
  const iqrRows = orderedLibraries.map((lib) => {
    const libData = scenario.libraries[lib.key];
    let fig = "—";
    if (libData) {
      const maxF = maxIqrFraction(libData.iqrFraction, runIndices);
      if (maxF > 0) {
        fig = `${(maxF * 100).toFixed(1)}%`;
      }
    }
    return `<div class="bh-metric-row"><span class="bh-metric-row__name">${lib.displayName}</span><span class="bh-metric-row__fig">${fig}</span></div>`;
  });

  cards.push({
    label: "Worst IQR÷median · per plotted run",
    value: "",
    meta: [`<div class="bh-metric__iqr">${iqrRows.join("")}</div>`],
  });

  const footPieces: Array<string> = [
    `${runIndices.length} run(s) on the chart${envKey ? "; environment filter on" : "; all environments"}. Median & range: all filtered runs with hz/op. Δ: % change from first → last run in this view when both have data`,
  ];
  if (runWindow !== "all" && runIndices.length < baseRunIndices.length) {
    footPieces.push(
      `Runs shown: last ${runIndices.length} of ${baseRunIndices.length} runs matching Environment + search/group filters`,
    );
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
 * @since 0.3.16-canary.1
 */
export function buildSnapshotRow(
  s: EmbeddedScenarioSeries,
  lastIx: number,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  paletteMap: Record<string, PaletteEntry>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
): SnapshotRow {
  const libHzMap: Record<string, number | null> = {};
  const hzCells: Array<string> = [];
  for (const lib of orderedLibraries) {
    const hz = s.libraries[lib.key]?.hz[lastIx] ?? null;
    const val = typeof hz === "number" && hz > 0 ? hz : null;
    libHzMap[lib.key] = val;
    hzCells.push(val !== null ? fmtHz(val) : "—");
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;
  const ratioCells: Array<string> = compareLibs.map((cmp) => {
    const ratio = ratioFrom(primaryHz, libHzMap[cmp.key] ?? null);
    return ratio !== null ? `${ratio.toFixed(3)}×` : "—";
  });

  return { id: s.id, group: s.group, hzCells, ratioCells };
}
