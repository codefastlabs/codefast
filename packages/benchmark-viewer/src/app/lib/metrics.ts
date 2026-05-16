import type { PaletteEntry } from "#/app/lib/colors";
import { DISPERSION_IQR_ALERT } from "#/app/lib/constants";
import { escHtml, fmtHz, fmtPctChange } from "#/app/lib/format";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

const META_MONO = "font-mono tracking-[-0.02em] tabular-nums";
const META_FINE = "text-[0.6875rem] leading-[1.45] opacity-90";
const METRIC_FIG = "text-bh-ink-strong font-mono tracking-[-0.02em] tabular-nums";
const METRIC_IQR = "mt-[0.28rem] flex flex-col gap-[0.42rem]";
const METRIC_ROW =
  "flex items-baseline justify-between gap-3 text-[0.72rem] leading-[1.35] tracking-[-0.012em]";
const METRIC_ROW_NAME = "text-bh-label min-w-0";
const METRIC_ROW_FIG = "text-bh-ink-mid shrink-0 font-mono tracking-[-0.02em] tabular-nums";

/**
 * @since 0.3.16-canary.1
 */
export function medianNumeric(values: Array<number | null | undefined>): number | null {
  const sorted = values
    .filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
    )
    .sort((left, right) => left - right);
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
  numeratorHz: number | null | undefined,
  denominatorHz: number | null | undefined,
): number | null {
  return typeof numeratorHz === "number" &&
    typeof denominatorHz === "number" &&
    numeratorHz > 0 &&
    denominatorHz > 0
    ? numeratorHz / denominatorHz
    : null;
}

function collectHzValues(
  hz: ReadonlyArray<number | null>,
  indices: ReadonlyArray<number>,
): Array<number> {
  return indices
    .map((globalIx) => hz[globalIx])
    .filter((hzValue): hzValue is number => typeof hzValue === "number" && hzValue > 0);
}

function maxIqrFraction(
  iqrFraction: ReadonlyArray<number | null>,
  indices: ReadonlyArray<number>,
): number {
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
    const minHz = hzValues.length ? hzValues.reduce((min, hz) => (hz < min ? hz : min)) : null;
    const maxHz = hzValues.length ? hzValues.reduce((max, hz) => (hz > max ? hz : max)) : null;

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
    if (minHz !== null && maxHz !== null) {
      meta.push(`<span class="${META_MONO}">Range ${fmtHz(minHz)} … ${fmtHz(maxHz)}</span>`);
    }
    meta.push(`Δ ${trend}`);
    if (runsWithData < runsPlotted) {
      meta.push(
        `<span class="${META_FINE}">${runsWithData} of ${runsPlotted} plotted runs have median hz/op</span>`,
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
        .map((globalIx) => ratioFrom(primData.hz[globalIx], cmpData.hz[globalIx]))
        .filter((ratio): ratio is number => ratio !== null);
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
          `Median of per-run ratios · <span class="${METRIC_FIG}">${medianOfRunRatios!.toFixed(3)}×</span>`,
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
    let iqrPercentLabel = "—";
    if (libData) {
      const maxIqr = maxIqrFraction(libData.iqrFraction, runIndices);
      if (maxIqr > 0) {
        iqrPercentLabel = `${(maxIqr * 100).toFixed(1)}%`;
      }
    }
    return `<div class="${METRIC_ROW}"><span class="${METRIC_ROW_NAME}">${escHtml(lib.displayName)}</span><span class="${METRIC_ROW_FIG}">${iqrPercentLabel}</span></div>`;
  });

  cards.push({
    label: "Worst IQR÷median · per plotted run",
    value: "",
    meta: [`<div class="${METRIC_IQR}">${iqrRows.join("")}</div>`],
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
  scenario: EmbeddedScenarioSeries,
  lastIx: number,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  paletteMap: Record<string, PaletteEntry>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
): SnapshotRow {
  const libHzMap: Record<string, number | null> = {};
  const hzCells: Array<string> = [];
  for (const lib of orderedLibraries) {
    const hz = scenario.libraries[lib.key]?.hz[lastIx] ?? null;
    const positiveHz = typeof hz === "number" && hz > 0 ? hz : null;
    libHzMap[lib.key] = positiveHz;
    hzCells.push(positiveHz !== null ? fmtHz(positiveHz) : "—");
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;
  const ratioCells: Array<string> = compareLibs.map((cmp) => {
    const ratio = ratioFrom(primaryHz, libHzMap[cmp.key] ?? null);
    return ratio !== null ? `${ratio.toFixed(3)}×` : "—";
  });

  return { id: scenario.id, group: scenario.group, hzCells, ratioCells };
}
