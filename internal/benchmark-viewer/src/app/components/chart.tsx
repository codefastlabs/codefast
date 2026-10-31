import { Chart } from "chart.js";
import type { ChartDataset, Plugin, ScriptableContext } from "chart.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { DisclosurePanel } from "#app/components/disclosure-panel";
import { ChevronDownIcon } from "#app/components/icons";
import { Kbd } from "#app/components/kbd";
import { OverlayLegend } from "#app/components/overlay-legend";
import { createMarkersPlugin, definitionChangeMarkers, versionChangeMarkers } from "#app/lib/annotations";
import {
  ALL_TOOLBAR_DISABLED,
  applyRelativeCategoryView,
  captureRelativeCategoryView,
  categoryXScaleWindow,
  computeChartToolbarDisabled,
  computeInitialCategoryWindow,
} from "#app/lib/chart-view";
import type { ChartToolbarDisabled, RelativeCategoryView } from "#app/lib/chart-view";
import { CHART_SURFACE, PAN_PIXELS_X, RATIO_COLORS, ZOOM_STEP_X, withAlpha } from "#app/lib/colors";
import type { PaletteEntry } from "#app/lib/colors";
import {
  fmtCount,
  fmtHz,
  fmtHzCompact,
  fmtRatio,
  fmtRunTick,
  formatLocal,
  isMacLikePlatform,
  spreadTierLabel,
} from "#app/lib/format";
import { ratioFrom } from "#app/lib/metrics";
import {
  buildOverlaySeries,
  indexToFirst,
  isFineLogTick,
  isSparseLogTick,
  rowShortLabel,
  spansLogDecade,
} from "#app/lib/overlay";
import type { OverlaySeries } from "#app/lib/overlay";
import { CHART_SKIP_TARGET_ID } from "#app/lib/skip-chart";
import { cn } from "#app/lib/utils";
import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries } from "#types";

/** The chart's text, drawn on a canvas that page CSS never reaches: the page's small size, a step brighter. */
const CHART_FONT = { family: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif", size: 13 } as const;
const CHART_TICK_COLOR = "rgba(235, 235, 245, 0.62)";

/** Both charts' y axes take this width, so their plot areas line up and each run sits at one x in both. */
const Y_AXIS_WIDTH = 76;

const GRID_COLOR = "rgba(255, 255, 255, 0.055)";

/** One primary-÷-compare line of the ratio chart. */
interface RatioSeries {
  readonly color: string;
  readonly data: ReadonlyArray<number | null>;
  readonly label: string;
}

/** Orders tooltip rows highest first, so they read in the order of the lines they describe, top to bottom. */
function highestFirst(left: { parsed: { y: number | null } }, right: { parsed: { y: number | null } }): number {
  return (right.parsed.y ?? Number.NEGATIVE_INFINITY) - (left.parsed.y ?? Number.NEGATIVE_INFINITY);
}

/** A tooltip title for one run: its local time and folder. */
function runTooltipTitle(run: EmbeddedRun | undefined): string {
  if (!run) {
    return "";
  }
  const clock = formatLocal(run.timestampIso, run.folder);
  return clock ? `${clock} (local)\n${run.folder}` : run.folder;
}

/** Draws a dashed rule at parity, where the primary library and the compared one run equally fast. */
const parityRulePlugin: Plugin<"line"> = {
  id: "ratio-parity-rule",
  beforeDatasetsDraw(chart) {
    const yScale = chart.scales["y"];
    if (!yScale || 1 < yScale.min || 1 > yScale.max) {
      return;
    }
    const y = yScale.getPixelForValue(1);
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = "rgba(235, 235, 245, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  },
};

interface RatioChartOptions {
  labels: ReadonlyArray<string>;
  runs: ReadonlyArray<EmbeddedRun | undefined>;
  series: ReadonlyArray<RatioSeries>;
  xWindow: { max: number; min: number } | undefined;
}

/**
 * Builds the ratio chart: the primary library ÷ each compared one per run, on its own axis with parity marked.
 *
 * @remarks Its x axis hides its ticks and follows the throughput chart's window, which sits right above it.
 */
function createRatioChart(canvas: HTMLCanvasElement, { labels, runs, series, xWindow }: RatioChartOptions): Chart {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: [...labels],
      datasets: series.map((line) => ({
        label: line.label,
        data: [...line.data],
        borderColor: line.color,
        backgroundColor: line.color,
        borderWidth: 2,
        pointRadius: 2.5,
        spanGaps: true,
        tension: 0.12,
      })),
    },
    plugins: [parityRulePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          type: "category",
          offset: labels.length < 2,
          ticks: { display: false },
          grid: { color: GRID_COLOR },
          ...xWindow,
        },
        y: {
          type: "linear",
          position: "left",
          // Parity always in range, so every ratio reads against it.
          suggestedMin: 1,
          suggestedMax: 1,
          afterFit: (scale) => {
            scale.width = Y_AXIS_WIDTH;
          },
          title: { display: true, text: "primary ÷ compare", color: CHART_TICK_COLOR, font: CHART_FONT },
          ticks: {
            color: CHART_TICK_COLOR,
            font: CHART_FONT,
            maxTicksLimit: 5,
            callback: (value) => (typeof value === "number" ? `${Number(value.toFixed(2))}×` : value),
          },
          grid: { color: GRID_COLOR },
        },
      },
      plugins: {
        legend: {
          labels: { color: "rgba(235, 235, 245, 0.8)", font: CHART_FONT, boxWidth: 14, boxHeight: 8 },
        },
        tooltip: {
          bodyFont: CHART_FONT,
          titleFont: { ...CHART_FONT, weight: "bold" },
          itemSort: highestFirst,
          callbacks: {
            title: (items) => (items[0] ? runTooltipTitle(runs[items[0].dataIndex]) : ""),
            label: (ctx) => `${ctx.dataset.label ?? ""}: ${fmtRatio(typeof ctx.raw === "number" ? ctx.raw : null)}`,
          },
        },
      },
      layout: { padding: { top: 4, right: 12, bottom: 2, left: 12 } },
    },
  });
}

/** Moves a follower chart's x window onto the leader's, so the two keep the same runs in view. */
function followCategoryWindow(follower: Chart | null, leader: Chart): void {
  const leaderX = leader.scales["x"];
  const followerX = follower?.options.scales?.["x"];
  if (!follower || !leaderX || !followerX) {
    return;
  }
  followerX.min = leaderX.min;
  followerX.max = leaderX.max;
  follower.update("none");
}

/** Drops any alpha so a tooltip swatch shows the line's true hue, not the faint fill under the curve. */
function toOpaqueColor(color: unknown): string {
  if (typeof color !== "string") {
    return "#e4e4e7";
  }
  const rgba = color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  return rgba ? `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})` : color;
}

function SegButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "border-e-bh-border bg-bh-surface-seg text-bh-seg-ink hover:bg-bh-surface-seg-hover disabled:hover:bg-bh-table-seg-disabled text-bh-small m-0 rounded-none border-0 border-e px-3 py-[0.35rem] leading-5 font-medium last:border-e-0 focus:z-1 focus:outline-none focus-visible:z-1 focus-visible:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      type="button"
    />
  );
}

function ChartTh({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b-bh-table-line bg-bh-table-head text-bh-label text-bh-caption z-3 border-b px-[0.65rem] py-[0.15rem] text-start font-semibold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

function ChartTd({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b-bh-table-line border-b px-[0.65rem] py-[0.15rem] text-start whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

interface DisplayToggleProps extends Omit<ComponentProps<"input">, "children" | "onChange" | "type"> {
  children: ReactNode;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * A display checkbox whose visible text is its accessible name, dimmed when it does not apply.
 *
 * @remarks The title sits on the label because a disabled input never shows its own tooltip.
 */
function DisplayToggle({ children, onCheckedChange, title, ...props }: DisplayToggleProps) {
  return (
    <label
      title={title}
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg py-0.5 has-enabled:hover:text-zinc-100 has-disabled:cursor-not-allowed has-disabled:opacity-50 max-sm:min-h-11 max-sm:justify-between max-sm:gap-3 max-sm:border-0 max-sm:px-3 max-sm:py-2.5"
    >
      <input
        className="text-bh-blue accent-bh-blue focus:ring-bh-blue/50 size-4 rounded border-white/20 bg-black/30 focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
        {...props}
        onChange={(event) => onCheckedChange(event.target.checked)}
        type="checkbox"
      />
      <span>{children}</span>
    </label>
  );
}

/** Every how many plotted runs a receding overlay line shows a marker, counted back from the newest. */
const SPARSE_POINT_EVERY = 4;

/** Up to this many plotted runs, every overlay line marks every point, so each row's shape stays readable. */
const DENSE_MARKER_LIMIT = 12;

/** The one stroke every overlay line draws with, so weight never reads as a property of a row. */
const OVERLAY_LINE_WIDTH = 2;

/**
 * The data, display flags, and callbacks ChartPanel renders one scenario's run history from.
 *
 * @since 0.3.16-canary.1
 */
export interface ChartPanelProps {
  scenario: EmbeddedScenarioSeries | null;
  /** The runs to plot — only runs with data for the scenario. */
  runIndices: Array<number>;
  /** Runs the window kept before the no-data filter, so the subtitle can say what was hidden. */
  filteredRunCount: number;
  baseRunIndices: Array<number>;
  runs: ReadonlyArray<EmbeddedRun>;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  primaryLib: EmbeddedLibraryMeta | undefined;
  compareLibs: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  showBands: boolean;
  useLogScale: boolean;
  showRatio: boolean;
  /** Every row of the selected scenario's group, drawn together when the overlay is active. */
  overlayScenarios: Array<EmbeddedScenarioSeries>;
  /** Every tracked library, in order — the overlay decides per row which of them drew anything. */
  overlayLibraries: Array<EmbeddedLibraryMeta>;
  /** The overlay toggle as the user set it, whether or not the group has enough rows to use it. */
  overlayGroup: boolean;
  overlayActive: boolean;
  /** Rows of the overlaid group the user has hidden from the legend table. */
  hiddenOverlayRows: Array<string>;
  /** Plots each line as a percentage of its first plotted run. */
  indexToFirstRun: boolean;
  envKey: string;
  onClearEnv: () => void;
  onClearSearch: () => void;
  onClearGroup: () => void;
  /** Receives every chart on screen, top to bottom, for one image. */
  onDownloadPng: (charts: ReadonlyArray<Chart>) => void;
  onOverlayGroupChange: (value: boolean) => void;
  onToggleOverlayRow: (scenarioId: string) => void;
  onSelectRow: (scenarioId: string) => void;
  onIndexToFirstRunChange: (value: boolean) => void;
  showBandsChange: (value: boolean) => void;
  logScaleChange: (value: boolean) => void;
  showRatioChange: (value: boolean) => void;
}

function buildChartSubtitle(
  scenario: EmbeddedScenarioSeries | null,
  overlayRowCount: number,
  runIndices: Array<number>,
  filteredRunCount: number,
  baseRunCount: number,
  envKey: string,
  indexToFirstRun: boolean,
): string {
  if (runIndices.length === 0) {
    return "No saved runs match the current Environment filter.";
  }
  if (!scenario) {
    return "No scenario available for these filters.";
  }
  let subtitle =
    overlayRowCount > 0
      ? `[${scenario.group}] ${overlayRowCount} rows overlaid, ${rowShortLabel(scenario.id, scenario.group)} emphasised · ${fmtCount(runIndices.length, "run")} with data`
      : `[${scenario.group}] ${scenario.id} · ${fmtCount(runIndices.length, "run")} with data`;
  if (indexToFirstRun) {
    subtitle += " · each line as % of its first plotted run";
  }
  const normalization = scenario.batchNormalization;
  if (normalization !== undefined) {
    subtitle += ` · ${fmtCount(normalization.rescaledRunCount, "older run")} rescaled to batch ${normalization.referenceBatch}`;
  }
  const hiddenRunCount = filteredRunCount - runIndices.length;
  if (hiddenRunCount > 0) {
    subtitle += ` · ${hiddenRunCount} without data hidden`;
  }
  if (envKey) {
    subtitle += " · environment filter on";
  }
  if (baseRunCount > filteredRunCount) {
    subtitle += ` · last ${filteredRunCount} of ${baseRunCount} matching runs`;
  }
  return subtitle;
}

/**
 * Renders the run-history line chart for one scenario, with its zoom/pan toolbar and details table.
 *
 * @since 0.3.16-canary.1
 */
export function ChartPanel({
  scenario,
  runIndices,
  filteredRunCount,
  baseRunIndices,
  runs,
  orderedLibraries,
  primaryLib,
  compareLibs,
  paletteMap,
  showBands,
  useLogScale,
  showRatio,
  overlayScenarios,
  overlayLibraries,
  overlayGroup,
  overlayActive,
  hiddenOverlayRows,
  indexToFirstRun,
  envKey,
  onClearEnv,
  onClearSearch,
  onClearGroup,
  onDownloadPng,
  onOverlayGroupChange,
  onToggleOverlayRow,
  onSelectRow,
  onIndexToFirstRunChange,
  showBandsChange,
  logScaleChange,
  showRatioChange,
}: ChartPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const ratioCanvasRef = useRef<HTMLCanvasElement>(null);
  const ratioChartRef = useRef<Chart | null>(null);
  const initialCategoryViewRef = useRef<{ max: number; min: number } | null>(null);
  // The user's zoom/pan window, carried across chart rebuilds (scenario switch, toggles).
  const capturedViewRef = useRef<RelativeCategoryView | undefined>(undefined);

  const [chartToolbarDisabled, setChartToolbarDisabled] = useState<ChartToolbarDisabled>(ALL_TOOLBAR_DISABLED);

  const hasData = scenario !== null && runIndices.length > 0;
  const canOverlay = overlayScenarios.length > 1;
  // Fully disabled without data; with data it mirrors the built chart's zoom/pan state.
  const toolbarDisabled = hasData ? chartToolbarDisabled : ALL_TOOLBAR_DISABLED;

  const overlaySeries = useMemo<Array<OverlaySeries>>(
    () =>
      overlayActive && scenario !== null
        ? buildOverlaySeries({
            hiddenScenarioIds: hiddenOverlayRows,
            libraries: overlayLibraries,
            paletteMap,
            runIndices,
            scenarios: overlayScenarios,
            selectedScenarioId: scenario.id,
          })
        : [],
    [overlayActive, scenario, hiddenOverlayRows, overlayLibraries, paletteMap, runIndices, overlayScenarios],
  );

  // Ratios draw in their own chart under the throughput one, never on a second y axis over it.
  const ratioSeries = useMemo<Array<RatioSeries>>(() => {
    if (!showRatio || overlayActive || scenario === null || primaryLib === undefined) {
      return [];
    }
    const primData = scenario.libraries[primaryLib.key];
    return compareLibs.flatMap((cmpLib, compareIndex) => {
      const cmpData = scenario.libraries[cmpLib.key];
      if (!primData || !cmpData) {
        return [];
      }
      const data = runIndices.map((globalIx) => ratioFrom(primData.hz[globalIx], cmpData.hz[globalIx]));
      // The two libraries may never share a run — an all-null series would only add a legend row.
      if (data.every((ratio) => ratio === null)) {
        return [];
      }
      return [
        {
          color: RATIO_COLORS[compareIndex % RATIO_COLORS.length]!,
          data,
          label: `${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
        },
      ];
    });
  }, [showRatio, overlayActive, scenario, primaryLib, compareLibs, runIndices]);

  // Rows compare as peers in their library's full colour; the selected row stands out by filled markers, drawn in front.
  // Over a long history a receding row thins its markers to every fourth point, counted back from the newest.
  const pointCount = runIndices.length;
  const overlayStyleOf = useCallback(
    (series: OverlaySeries) => ({
      borderColor: series.color,
      borderWidth: OVERLAY_LINE_WIDTH,
      pointBackgroundColor: series.emphasized ? series.color : CHART_SURFACE,
      pointRadius:
        series.emphasized || pointCount <= DENSE_MARKER_LIMIT
          ? 2.5
          : (context: ScriptableContext<"line">) =>
              (pointCount - 1 - context.dataIndex) % SPARSE_POINT_EVERY === 0 ? 2.5 : 0,
    }),
    [pointCount],
  );

  // Lifting one row: its lines at full colour with every marker, every other line faded; `null` restores every style.
  const highlightOverlayRow = useCallback(
    (scenarioId: string | null) => {
      const chart = chartRef.current;
      if (!chart || !overlayActive) {
        return;
      }
      overlaySeries.forEach((series, index) => {
        const dataset = chart.data.datasets[index];
        if (!dataset) {
          return;
        }
        Object.assign(
          dataset,
          scenarioId === null
            ? overlayStyleOf(series)
            : series.scenarioId === scenarioId
              ? { ...overlayStyleOf(series), pointBackgroundColor: series.color, pointRadius: 2.5 }
              : { ...overlayStyleOf(series), borderColor: withAlpha(series.color, 0.12), pointRadius: 0 },
        );
      });
      chart.update("none");
    },
    [overlayActive, overlaySeries, overlayStyleOf],
  );
  const emptyReason = getEmptyReason(scenario, runIndices, filteredRunCount, runs);

  const syncToolbarFromChart = useCallback(() => {
    const chart = chartRef.current;
    const initial = initialCategoryViewRef.current;
    const plottedRunCount = runIndices.length;
    if (chart) {
      followCategoryWindow(ratioChartRef.current, chart);
    }
    if (!chart || !hasData || !initial || plottedRunCount < 2) {
      setChartToolbarDisabled(ALL_TOOLBAR_DISABLED);
      return;
    }
    setChartToolbarDisabled(computeChartToolbarDisabled(chart, initial, plottedRunCount));
  }, [hasData, runIndices.length]);

  // Build and update chart imperatively
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!scenario || runIndices.length === 0) {
      chartRef.current?.destroy();
      chartRef.current = null;
      initialCategoryViewRef.current = null;
      return;
    }

    const existing = Chart.getChart(canvas);
    existing?.destroy();

    // Time-only ticks when every plotted run shares one day; the tooltip title keeps the full stamp.
    const plottedDays = new Set(
      runIndices.map((globalIx) => runs[globalIx]?.timestampIso.slice(0, 10)).filter(Boolean),
    );
    const sameDay = plottedDays.size <= 1;
    const labels = runIndices.map((globalIx) => {
      const run = runs[globalIx];
      return run ? fmtRunTick(run.timestampIso, run.folder, sameDay) : "";
    });
    const runsSlice = runIndices.map((globalIx) => runs[globalIx]);

    const datasets: Array<ChartDataset<"line", Array<number | null>>> = [];
    const overlaySeriesByLabel = new Map(overlaySeries.map((series) => [series.label, series]));
    // The selected row's line per library, which every other row's tooltip value is read against.
    const selectedSeriesByLibrary = new Map(
      overlaySeries.filter((series) => series.emphasized).map((series) => [series.libraryKey, series]),
    );
    const plottedValues = (values: ReadonlyArray<number | null>) =>
      indexToFirstRun ? indexToFirst(values).values : [...values];

    for (const series of overlaySeries) {
      datasets.push({
        label: series.label,
        data: plottedValues(series.data),
        ...overlayStyleOf(series),
        backgroundColor: series.color,
        borderDash: [...series.borderDash],
        pointStyle: series.pointStyle,
        pointHoverRadius: 4,
        pointHitRadius: 6,
        spanGaps: false,
        yAxisID: "y",
        tension: 0.12,
        order: series.emphasized ? 4 : 6,
      });
    }

    for (const lib of overlayActive ? [] : orderedLibraries) {
      const libData = scenario.libraries[lib.key];
      if (!libData) {
        continue;
      }
      const paletteEntry = paletteMap[lib.key]!;
      const rawHz = runIndices.map((globalIx) => libData.hz[globalIx] ?? null);
      const indexed = indexToFirst(rawHz);
      const hz = indexToFirstRun ? indexed.values : rawHz;
      // Bands scale by the same base as the line they surround, so they stay around it.
      const scaleBand = (value: number | null) =>
        indexToFirstRun ? (value === null || indexed.base === null ? null : (value / indexed.base) * 100) : value;

      if (showBands) {
        const p25 = runIndices.map((globalIx) => scaleBand(libData.p25[globalIx] ?? null));
        const p75 = runIndices.map((globalIx) => scaleBand(libData.p75[globalIx] ?? null));
        datasets.push(
          {
            label: `${lib.displayName} P25`,
            data: p25,
            borderWidth: 0,
            pointRadius: 0,
            borderColor: "transparent",
            backgroundColor: "transparent",
            spanGaps: false,
            yAxisID: "y",
            order: 10,
          },
          {
            label: `${lib.displayName} P25–P75`,
            data: p75,
            borderWidth: 0,
            pointRadius: 0,
            fill: "-1",
            borderColor: "transparent",
            backgroundColor: paletteEntry.band,
            spanGaps: false,
            yAxisID: "y",
            order: 10,
          },
        );
      }

      datasets.push({
        label: lib.displayName,
        data: hz,
        borderColor: paletteEntry.border,
        backgroundColor: `${paletteEntry.band.slice(0, paletteEntry.band.lastIndexOf(",") + 1)} 0.08)`,
        spanGaps: false,
        yAxisID: "y",
        tension: 0.12,
        order: 5,
      });
    }

    const pointCount = labels.length;
    initialCategoryViewRef.current = computeInitialCategoryWindow(pointCount);
    // A window the user zoomed/panned survives the rebuild; the default view stays the default.
    const restoredView = capturedViewRef.current;
    const xWindow =
      restoredView === undefined
        ? categoryXScaleWindow(pointCount)
        : applyRelativeCategoryView(restoredView, pointCount);

    const scales: Record<string, object> = {
      x: {
        type: "category",
        // Edge to edge, because a zoomed window draws its lines on past the left bound but stops at the right one,
        // which a half-category offset would leave as a gap; a lone run still needs the offset to sit centred.
        offset: pointCount < 2,
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.min(22, Math.max(pointCount || 2, 2)),
          maxRotation: 52,
          minRotation: 0,
          color: CHART_TICK_COLOR,
          font: CHART_FONT,
        },
        grid: { color: GRID_COLOR, drawOnChartArea: true },
        ...xWindow,
      },
      y: {
        type: useLogScale ? "logarithmic" : "linear",
        position: "left",
        afterFit: (scale: { width: number }) => {
          scale.width = Y_AXIS_WIDTH;
        },
        title: {
          display: true,
          text: indexToFirstRun ? "% of first plotted run" : "hz/op (median)",
          color: CHART_TICK_COLOR,
          font: CHART_FONT,
        },
        ticks: {
          color: CHART_TICK_COLOR,
          font: CHART_FONT,
          // Compact ticks (70M) stay readable where full digits clip on narrow viewports; a log axis labels
          // only round mantissas, coarser once it spans a decade, so its ticks neither pile up nor vanish.
          callback: (value: number | string, _index: number, ticks: ReadonlyArray<{ value: number }>) => {
            if (typeof value !== "number") {
              return value;
            }
            if (useLogScale && !(spansLogDecade(ticks) ? isSparseLogTick(value) : isFineLogTick(value))) {
              return "";
            }
            return indexToFirstRun ? `${fmtHzCompact(value)}%` : fmtHzCompact(value);
          },
        },
        grid: { color: GRID_COLOR },
      },
    };

    // Runs where the suite redefined the row, or the primary library changed version, get a rule.
    const markers = [
      ...definitionChangeMarkers(scenario, runIndices),
      ...versionChangeMarkers(runs, runIndices, primaryLib),
    ];

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      plugins: [createMarkersPlugin(markers)],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300, easing: "easeOutCubic" },
        interaction: { mode: "index", intersect: false },
        scales,
        plugins: {
          legend: {
            // The overlay draws its legend as a table under the chart instead.
            display: !overlayActive,
            labels: {
              color: "rgba(235, 235, 245, 0.8)",
              font: CHART_FONT,
              boxWidth: 14,
              boxHeight: 8,
              filter: (item) => {
                const legendText = item.text ?? "";
                return !legendText.endsWith(" P25") && !legendText.includes("P25–P75");
              },
            },
          },
          tooltip: {
            bodyFont: CHART_FONT,
            titleFont: { ...CHART_FONT, weight: "bold" },
            filter: (item) => {
              const datasetLabel = item.dataset.label ?? "";
              return !datasetLabel.endsWith(" P25") && !datasetLabel.includes("P25–P75");
            },
            itemSort: highestFirst,
            callbacks: {
              // Chart.js fills the swatch with the dataset's backgroundColor — for a line that is the
              // near-transparent band under the curve, so the swatch reads as its solid line colour instead.
              labelColor: (ctx) => ({
                borderColor: toOpaqueColor(ctx.dataset.borderColor),
                backgroundColor: toOpaqueColor(ctx.dataset.borderColor),
                borderWidth: 0,
                borderRadius: 3,
              }),
              title: (items) => (items[0] ? runTooltipTitle(runsSlice[items[0].dataIndex]) : ""),
              afterTitle: (items) => {
                if (!items.length) {
                  return "";
                }
                const run = runsSlice[items[0]!.dataIndex];
                if (!run) {
                  return "";
                }
                const verLine = (run.libraryVersions ?? [])
                  .map(
                    (libraryVersion) =>
                      `${libraryVersion.key} ${libraryVersion.version}${libraryVersion.gcExposed ? " [gc]" : ""}`,
                  )
                  .join(" · ");
                return [
                  `${run.cpuModel} · ${run.platform}/${run.arch}`,
                  `Node ${run.nodeVersion} · V8 ${run.v8Version}`,
                  verLine,
                ].join("\n");
              },
              label: (ctx) => {
                const rawHz = ctx.raw as number | null;
                const datasetLabel = ctx.dataset.label ?? "";
                if (datasetLabel.includes("P25–P75") || datasetLabel.endsWith(" P25")) {
                  return undefined;
                }
                if (rawHz === null || rawHz === undefined) {
                  return `${datasetLabel}: —`;
                }
                let extra = "";
                const overlayMatch = overlaySeriesByLabel.get(datasetLabel);
                if (overlayMatch !== undefined) {
                  const absolute = overlayMatch.data[ctx.dataIndex] ?? null;
                  const valueText = indexToFirstRun ? `${rawHz.toFixed(1)}% (${fmtHz(absolute)})` : fmtHz(absolute);
                  const selected = selectedSeriesByLibrary.get(overlayMatch.libraryKey);
                  if (overlayMatch.emphasized) {
                    extra += " · selected";
                  } else if (selected !== undefined) {
                    const ratio = ratioFrom(absolute, selected.data[ctx.dataIndex] ?? null);
                    if (ratio !== null) {
                      extra += ` · ${fmtRatio(ratio)} of ${selected.shortLabel}`;
                    }
                  }
                  const iqrFraction = overlayMatch.iqrFraction[ctx.dataIndex];
                  if (typeof iqrFraction === "number" && Number.isFinite(iqrFraction)) {
                    extra += ` · IQR ${(iqrFraction * 100).toFixed(1)}%${spreadTierLabel(iqrFraction)}`;
                  }
                  return `${datasetLabel}: ${valueText}${extra}`;
                }
                // Exact label match — a displayName that prefixes another must not steal its IQR.
                const matchedLib = orderedLibraries.find((lib) => datasetLabel === lib.displayName);
                if (matchedLib && indexToFirstRun) {
                  const globalIx = runIndices[ctx.dataIndex];
                  const absolute =
                    globalIx === undefined ? null : (scenario.libraries[matchedLib.key]?.hz[globalIx] ?? null);
                  extra = ` (${fmtHz(absolute)})`;
                }
                if (matchedLib) {
                  const libData = scenario.libraries[matchedLib.key];
                  const globalIx = runIndices[ctx.dataIndex];
                  const iqrFraction = globalIx !== undefined ? libData?.iqrFraction[globalIx] : null;
                  if (typeof iqrFraction === "number" && Number.isFinite(iqrFraction)) {
                    extra = ` · IQR ${(iqrFraction * 100).toFixed(1)}%${spreadTierLabel(iqrFraction)}`;
                  }
                }
                return `${datasetLabel}: ${indexToFirstRun ? `${rawHz.toFixed(1)}%` : fmtHz(rawHz)}${extra}`;
              },
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              onPan: ({ chart: panChart }) => followCategoryWindow(ratioChartRef.current, panChart),
              onPanComplete: ({ chart: panChart }) => {
                chartRef.current = panChart;
                queueMicrotask(syncToolbarFromChart);
              },
            },
            zoom: {
              wheel: { enabled: true, modifierKey: "ctrl" },
              pinch: { enabled: true },
              mode: "x",
              drag: { enabled: false },
              onZoom: ({ chart: zoomChart }) => followCategoryWindow(ratioChartRef.current, zoomChart),
              onZoomComplete: ({ chart: zoomChart }) => {
                chartRef.current = zoomChart;
                queueMicrotask(syncToolbarFromChart);
              },
            },
            limits: {},
          },
        },
        layout: { padding: { top: 4, right: 12, bottom: 2, left: 12 } },
      },
    });

    const ratioCanvas = ratioCanvasRef.current;
    if (ratioCanvas && ratioSeries.length > 0) {
      Chart.getChart(ratioCanvas)?.destroy();
      ratioChartRef.current = createRatioChart(ratioCanvas, { labels, runs: runsSlice, series: ratioSeries, xWindow });
    }

    requestAnimationFrame(() => {
      chartRef.current?.resize();
      syncToolbarFromChart();
    });

    return () => {
      const outgoingChart = chartRef.current;
      const initialView = initialCategoryViewRef.current;
      if (outgoingChart && initialView) {
        capturedViewRef.current = captureRelativeCategoryView(
          outgoingChart,
          initialView,
          outgoingChart.data.labels?.length ?? 0,
        );
      }
      outgoingChart?.destroy();
      chartRef.current = null;
      ratioChartRef.current?.destroy();
      ratioChartRef.current = null;
      initialCategoryViewRef.current = null;
      setChartToolbarDisabled(ALL_TOOLBAR_DISABLED);
    };
  }, [
    scenario,
    runIndices,
    runs,
    orderedLibraries,
    paletteMap,
    showBands,
    useLogScale,
    overlayActive,
    overlaySeries,
    overlayStyleOf,
    indexToFirstRun,
    primaryLib,
    ratioSeries,
    syncToolbarFromChart,
  ]);

  // Window resize → chart resize
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let scheduled = false;
    const onResize = () => {
      if (scheduled || !chartRef.current) {
        return;
      }
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        chartRef.current?.resize();
        chartRef.current?.update("none");
        syncToolbarFromChart();
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncToolbarFromChart]);

  // Open display details on desktop
  const displayDetailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const displayDetails = displayDetailsRef.current;
    if (!displayDetails) {
      return;
    }
    const mql = window.matchMedia("(min-width: 640px)");
    if (mql.matches) {
      displayDetails.open = true;
    }
    const onChange = (event: MediaQueryListEvent) => {
      displayDetails.open = event.matches;
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function applyChartAction(disabledKey: keyof ChartToolbarDisabled, chartAction: (chart: Chart) => void) {
    const chart = chartRef.current;
    if (!chart || toolbarDisabled[disabledKey]) {
      return;
    }
    chartAction(chart);
    chart.resize();
    chart.update("none");
    followCategoryWindow(ratioChartRef.current, chart);
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  function handleZoomIn() {
    applyChartAction("zoomIn", (chart) => chart.zoom({ x: ZOOM_STEP_X }, "none"));
  }

  function handleZoomOut() {
    applyChartAction("zoomOut", (chart) => chart.zoom({ x: 1 / ZOOM_STEP_X }, "none"));
  }

  function handlePanEarlier() {
    applyChartAction("earlier", (chart) => chart.pan({ x: PAN_PIXELS_X }, undefined, "none"));
  }

  function handlePanLater() {
    applyChartAction("later", (chart) => chart.pan({ x: -PAN_PIXELS_X }, undefined, "none"));
  }

  function handleResetZoom() {
    // The chart may have been created on a carried-over zoom window, and the plugin's resetZoom
    // returns to the creation window — reset must mean the default view instead.
    applyChartAction("reset", (chart) => {
      const initialView = initialCategoryViewRef.current;
      if (initialView) {
        chart.zoomScale("x", initialView, "none");
      } else {
        chart.resetZoom();
      }
    });
  }

  return (
    <section
      aria-labelledby="chart-section-title"
      className="border-bh-border bg-bh-surface overflow-x-clip rounded-[1.25rem] border px-4 py-4 shadow-(--shadow-bh-glass) backdrop-blur-xl backdrop-saturate-180 sm:px-6 sm:py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/6 pb-4">
        <div>
          <h2 className="text-bh-body font-semibold tracking-[-0.01em] text-zinc-50" id="chart-section-title">
            Throughput over filtered runs
          </h2>
          <p className="text-bh-small text-bh-label-muted mt-1.5 leading-snug">
            {hasData
              ? buildChartSubtitle(
                  scenario,
                  overlayActive ? overlayScenarios.length : 0,
                  runIndices,
                  filteredRunCount,
                  baseRunIndices.length,
                  envKey,
                  indexToFirstRun,
                )
              : "—"}
          </p>
        </div>
      </div>

      <div
        aria-label="Chart pan and zoom"
        className="border-bh-border bg-bh-surface-toolbar shadow-bh-toolbar mt-4 mb-2 inline-flex flex-wrap overflow-hidden rounded-xl border backdrop-blur-md backdrop-saturate-150"
        role="toolbar"
      >
        <SegButton
          disabled={toolbarDisabled.zoomIn}
          onClick={handleZoomIn}
          title={toolbarDisabled.zoomIn ? "Already at maximum zoom for this range" : undefined}
        >
          Zoom +
        </SegButton>
        <SegButton
          disabled={toolbarDisabled.zoomOut}
          onClick={handleZoomOut}
          title={toolbarDisabled.zoomOut ? "Showing the full run history on the chart" : undefined}
        >
          Zoom −
        </SegButton>
        <SegButton
          disabled={toolbarDisabled.earlier}
          onClick={handlePanEarlier}
          title={toolbarDisabled.earlier ? "Already showing the earliest runs" : undefined}
        >
          ← Earlier
        </SegButton>
        <SegButton
          disabled={toolbarDisabled.later}
          onClick={handlePanLater}
          title={toolbarDisabled.later ? "Already showing the newest runs" : undefined}
        >
          Later →
        </SegButton>
        <SegButton
          disabled={toolbarDisabled.reset}
          id="chart-reset-zoom-btn"
          onClick={handleResetZoom}
          title={toolbarDisabled.reset ? "Chart is already at the default time window" : undefined}
        >
          Reset zoom
        </SegButton>
      </div>

      <p className="text-bh-small text-bh-label-muted leading-relaxed">
        Opens on the newest runs, where Reset zoom returns. <ZoomGestureHint /> ·{" "}
        {overlayActive ? "the table below the chart selects, hides and lifts rows" : "the legend toggles series"}.
        Dashed yellow rules mark runs where the row's definition or the primary library's version changed.
      </p>

      <section
        aria-label="Throughput over time chart"
        className="relative mt-5 h-[min(32rem,70dvh)] min-h-80 w-full scroll-mt-[calc(max(0.5rem,env(safe-area-inset-top,0))+7.5rem)] overflow-hidden rounded-2xl bg-black/40 shadow-(--shadow-bh-glass-tight) ring-1 ring-white/8 focus:outline-none"
        id={CHART_SKIP_TARGET_ID}
        tabIndex={-1}
      >
        {!hasData && (
          <div
            aria-live="polite"
            className="bg-bh-overlay-soft absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl p-6 text-center backdrop-blur-md"
            id="chart-empty-state"
          >
            <p className="text-bh-meta text-bh-small max-w-96 leading-normal">{emptyReason}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {envKey && (
                <button
                  className="focus-visible:ring-bh-blue text-bh-small inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
                  onClick={onClearEnv}
                  type="button"
                >
                  Show all environments
                </button>
              )}
              <button
                className="focus-visible:ring-bh-blue text-bh-small inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
                onClick={onClearSearch}
                type="button"
              >
                Clear search
              </button>
              <button
                className="focus-visible:ring-bh-blue text-bh-small inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
                onClick={onClearGroup}
                type="button"
              >
                All groups
              </button>
            </div>
          </div>
        )}
        <canvas
          aria-label="Throughput over time chart"
          className="block h-full w-full"
          id="bench-chart"
          ref={canvasRef}
        />
      </section>

      {hasData && ratioSeries.length > 0 && (
        <section
          aria-label="Primary ratio over time chart"
          className="relative mt-3 h-48 w-full overflow-hidden rounded-2xl bg-black/40 shadow-(--shadow-bh-glass-tight) ring-1 ring-white/8"
        >
          <canvas aria-label="Primary ratio over time chart" className="block h-full w-full" ref={ratioCanvasRef} />
        </section>
      )}

      {overlayActive && scenario !== null && (
        <OverlayLegend
          hiddenRows={hiddenOverlayRows}
          libraries={overlayLibraries}
          onHoverRow={highlightOverlayRow}
          onSelectRow={onSelectRow}
          onToggleRow={onToggleOverlayRow}
          paletteMap={paletteMap}
          rows={overlayScenarios}
          selectedScenarioId={scenario.id}
          series={overlaySeries}
        />
      )}

      {/* Display toggles — `group` enables group-open: chevron rotation */}
      <details className="group mt-1 border-t border-white/6 sm:mt-0 sm:border-t-0" ref={displayDetailsRef}>
        <summary className="focus-visible:outline-bh-blue flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-2.5 pe-0.5 text-zinc-200 select-none marker:content-[''] focus-visible:outline focus-visible:outline-offset-2 max-sm:-mx-0.5 max-sm:px-1 max-sm:active:bg-white/4 sm:hidden [&::-webkit-details-marker]:hidden">
          <span className="text-bh-label text-bh-caption font-semibold tracking-[0.14em] uppercase">
            Display &amp; export
          </span>
          <ChevronDownIcon className="text-bh-label-muted size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180 sm:hidden" />
        </summary>
        <div className="text-bh-body flex flex-col gap-3 text-zinc-300 max-sm:gap-0 max-sm:divide-y max-sm:divide-white/6 max-sm:overflow-hidden max-sm:rounded-xl max-sm:bg-black/22 max-sm:py-0 max-sm:ring-1 max-sm:ring-white/6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:divide-y-0 sm:pt-4">
          <span className="text-bh-label-muted text-bh-caption hidden tracking-[0.12em] sm:inline">Display</span>
          <DisplayToggle
            checked={overlayGroup && canOverlay}
            disabled={!canOverlay}
            onCheckedChange={onOverlayGroupChange}
            title={
              canOverlay
                ? "Draw every row of this group on one chart: colour per library, dash pattern per row"
                : "This group has a single row, so there is nothing to overlay"
            }
          >
            {overlayScenarios.length > 0
              ? `Overlay group (${fmtCount(overlayScenarios.length, "row")})`
              : "Overlay group"}
          </DisplayToggle>
          <DisplayToggle
            checked={showBands}
            disabled={overlayActive}
            onCheckedChange={showBandsChange}
            title={
              overlayActive
                ? "Not drawn while the group is overlaid"
                : "Per-trial P25–P75 spread around each run median"
            }
          >
            P25–P75 band
          </DisplayToggle>
          <DisplayToggle
            checked={indexToFirstRun}
            onCheckedChange={onIndexToFirstRunChange}
            title="Plot every line as a percentage of its own first plotted run, so lines of any scale share the axis"
          >
            Relative to first run
          </DisplayToggle>
          <DisplayToggle
            checked={useLogScale}
            onCheckedChange={logScaleChange}
            title="Space the Y axis by orders of magnitude, so fast and slow lines both keep their shape"
          >
            Log Y axis
          </DisplayToggle>
          <DisplayToggle
            checked={showRatio}
            disabled={overlayActive}
            onCheckedChange={showRatioChange}
            title={
              overlayActive
                ? "Not drawn while the group is overlaid"
                : "Draw the primary library ÷ each compared library on a right-hand axis"
            }
          >
            {primaryLib && compareLibs.length === 1
              ? `Primary ratio (${primaryLib.displayName} ÷ ${compareLibs[0]!.displayName})`
              : "Primary ratios"}
          </DisplayToggle>
          <button
            className="border-bh-border bg-bh-fill-white-4 shadow-bh-btn-reload text-bh-ink hover:bg-bh-fill-white-7 hover:border-bh-border-strong hover:text-bh-ink-hover focus-visible:outline-bh-blue text-bh-small order-last w-full shrink-0 justify-center rounded-xl border px-4 py-2.5 font-[inherit] font-medium tracking-[-0.015em] backdrop-blur-md backdrop-saturate-160 [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-[0.1875rem] max-sm:mt-0 max-sm:min-h-11 max-sm:rounded-none max-sm:border-0 max-sm:py-3 sm:order-0 sm:ms-auto sm:w-auto sm:py-2"
            id="chart-download-png-btn"
            onClick={() => onDownloadPng([chartRef.current, ratioChartRef.current].filter((chart) => chart !== null))}
            title="Capture the charts as shown, ratios included, as one PNG"
            type="button"
          >
            Download PNG
          </button>
        </div>
      </details>

      {/* The chart's numbers as text: exact values to read, copy, or hear with a screen reader. */}
      <DisclosurePanel className="mt-6" id="chart-data-details" summary="Chart data as a table">
        <p className="text-bh-small text-bh-label-muted leading-relaxed">
          {!hasData
            ? "Nothing is plotted, so there is no data to list."
            : overlayActive
              ? "The selected row's points and libraries; the chart above overlays every row of its group. Newest run first."
              : "Same points and libraries as the line chart above, newest run first — exact values to read or copy."}
        </p>
        <div className="border-bh-border bg-bh-scrim-table mt-3 overflow-x-auto rounded-xl border [-webkit-overflow-scrolling:touch]">
          <table aria-label="Chart series data" className="text-bh-small w-full border-collapse tabular-nums">
            {hasData && (
              <thead>
                <ChartTableHeader compareLibs={compareLibs} orderedLibraries={orderedLibraries} />
              </thead>
            )}
            <tbody>
              {hasData &&
                runIndices
                  .slice()
                  .toReversed()
                  .map((globalIx) => {
                    const run = runs[globalIx];
                    return run ? (
                      <ChartTableRow
                        compareLibs={compareLibs}
                        globalIx={globalIx}
                        key={globalIx}
                        orderedLibraries={orderedLibraries}
                        primaryLib={primaryLib}
                        run={run}
                        scenario={scenario}
                      />
                    ) : null;
                  })}
            </tbody>
          </table>
        </div>
      </DisclosurePanel>
    </section>
  );
}

/** The zoom and pan gestures for the reader's pointer: a modified wheel and a drag, or a pinch on touch. */
function ZoomGestureHint() {
  return (
    <>
      <span className="pointer-coarse:hidden" suppressHydrationWarning>
        {isMacLikePlatform() ? <Kbd>⌃ Control</Kbd> : <Kbd>Ctrl</Kbd>}
        +wheel zooms, drag pans
      </span>
      <span className="hidden pointer-coarse:inline">Pinch zooms, drag pans</span>
    </>
  );
}

function getEmptyReason(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  filteredRunCount: number,
  runs: ReadonlyArray<EmbeddedRun>,
): string {
  if (runs.length === 0) {
    return "No benchmark runs are in this history yet. Generate data with your bench command, then refresh this page.";
  }
  if (filteredRunCount === 0) {
    return "No runs match the selected environment. Widen the filter to see the chart again.";
  }
  if (!scenario) {
    return "Pick a scenario from the Scenario list above.";
  }
  if (runIndices.length === 0) {
    return "No run in this window measured this scenario. Widen the run window or pick another scenario.";
  }
  return "Nothing to plot for this selection.";
}

interface ChartTableHeaderProps {
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  compareLibs: Array<EmbeddedLibraryMeta>;
}

function ChartTableHeader({ orderedLibraries, compareLibs }: ChartTableHeaderProps) {
  return (
    <tr>
      <ChartTh scope="col">Run (local)</ChartTh>
      <ChartTh scope="col">Folder</ChartTh>
      {orderedLibraries.map((lib) => (
        <ChartTh className="text-end tabular-nums" key={lib.key} scope="col">
          {lib.displayName} hz/op
        </ChartTh>
      ))}
      {compareLibs.map((cmp) => (
        <ChartTh className="text-bh-ratio-accent text-end tabular-nums" key={cmp.key} scope="col">
          ÷ {cmp.displayName}
        </ChartTh>
      ))}
    </tr>
  );
}

interface ChartTableRowProps {
  globalIx: number;
  run: EmbeddedRun;
  scenario: EmbeddedScenarioSeries;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  primaryLib: EmbeddedLibraryMeta | undefined;
  compareLibs: Array<EmbeddedLibraryMeta>;
}

function ChartTableRow({ globalIx, run, scenario, orderedLibraries, primaryLib, compareLibs }: ChartTableRowProps) {
  const localClock = formatLocal(run.timestampIso, run.folder);

  const libHzMap: Record<string, number | null> = {};
  for (const lib of orderedLibraries) {
    const hz = scenario.libraries[lib.key]?.hz[globalIx] ?? null;
    libHzMap[lib.key] = typeof hz === "number" && hz > 0 ? hz : null;
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;

  return (
    <tr className="hover:bg-bh-table-hover even:bg-bh-table-zebra even:hover:bg-bh-table-zebra-hover">
      {/* Local clock text depends on the viewer's locale/timezone, which the server cannot know. */}
      <ChartTd suppressHydrationWarning>{localClock}</ChartTd>
      <ChartTd>{run.folder}</ChartTd>
      {orderedLibraries.map((lib) => (
        <ChartTd className="text-end tabular-nums" key={lib.key}>
          {fmtHz(libHzMap[lib.key])}
        </ChartTd>
      ))}
      {compareLibs.map((cmp) => (
        <ChartTd className="text-end tabular-nums" key={cmp.key}>
          {fmtRatio(ratioFrom(primaryHz, libHzMap[cmp.key] ?? null))}
        </ChartTd>
      ))}
    </tr>
  );
}

export type { Chart as ChartInstance };
