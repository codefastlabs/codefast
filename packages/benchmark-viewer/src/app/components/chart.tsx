import {
  type ComponentProps,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Chart } from "chart.js";
import { ChevronDownIcon } from "#/app/components/icons";
import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries } from "#/types";
import { type PaletteEntry, PAN_PIXELS_X, RATIO_COLORS, ZOOM_STEP_X } from "#/app/lib/colors";
import {
  ALL_TOOLBAR_DISABLED,
  type ChartToolbarDisabled,
  categoryXScaleWindow,
  computeChartToolbarDisabled,
  computeInitialCategoryWindow,
} from "#/app/lib/chart-view";
import { formatLocal, isMacLikePlatform, spreadTierLabel } from "#/app/lib/format";
import { cn } from "#/app/lib/utils";
import { ratioFrom } from "#/app/lib/metrics";

function SegButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "text-bh-seg-ink border-r-bh-border bg-bh-surface-seg hover:bg-bh-surface-seg-hover disabled:hover:bg-bh-table-seg-disabled m-0 rounded-none border-0 border-r px-3 py-[0.35rem] text-[0.8125rem] leading-5 font-medium last:border-r-0 focus:z-1 focus:outline-none focus-visible:z-1 focus-visible:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] disabled:cursor-not-allowed disabled:opacity-40",
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
        "border-b-bh-table-line bg-bh-table-head text-bh-label z-3 border-b px-[0.65rem] py-[0.15rem] text-left text-[0.7rem] font-semibold tracking-wider whitespace-nowrap uppercase",
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
        "border-b-bh-table-line border-b px-[0.65rem] py-[0.15rem] text-left",
        className,
      )}
      {...props}
    />
  );
}

/**
 * @since 0.3.16-canary.1
 */
export interface ChartPanelProps {
  scenario: EmbeddedScenarioSeries | null;
  runIndices: Array<number>;
  baseRunIndices: Array<number>;
  runs: ReadonlyArray<EmbeddedRun>;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  showBands: boolean;
  useLogScale: boolean;
  showRatio: boolean;
  envKey: string;
  onClearEnv: () => void;
  onClearSearch: () => void;
  onClearGroup: () => void;
  onDownloadPng: (chartRef: RefObject<Chart | null>) => void;
  showBandsChange: (value: boolean) => void;
  logScaleChange: (value: boolean) => void;
  showRatioChange: (value: boolean) => void;
}

function buildChartSubtitle(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  baseRunIndices: Array<number>,
  envKey: string,
): string {
  if (runIndices.length === 0) {
    return "No saved runs match the current Environment filter.";
  }
  if (!scenario) {
    return "No scenario available for these filters.";
  }
  let subtitle = `[${scenario.group}] ${scenario.id} · ${runIndices.length} plotted point(s)`;
  if (envKey) {
    subtitle += " · environment filter on";
  }
  if (baseRunIndices.length > runIndices.length) {
    subtitle += ` · last ${runIndices.length} of ${baseRunIndices.length} matching runs`;
  }
  return subtitle;
}

/**
 * @since 0.3.16-canary.1
 */
export function ChartPanel({
  scenario,
  runIndices,
  baseRunIndices,
  runs,
  orderedLibraries,
  paletteMap,
  showBands,
  useLogScale,
  showRatio,
  envKey,
  onClearEnv,
  onClearSearch,
  onClearGroup,
  onDownloadPng,
  showBandsChange,
  logScaleChange,
  showRatioChange,
}: ChartPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const initialCategoryViewRef = useRef<{ max: number; min: number } | null>(null);
  const syncToolbarRef = useRef<(() => void) | undefined>(undefined);

  const [toolbarDisabled, setToolbarDisabled] =
    useState<ChartToolbarDisabled>(ALL_TOOLBAR_DISABLED);

  const primaryLib = useMemo(
    () => orderedLibraries.find((lib) => lib.isPrimary) ?? orderedLibraries[0],
    [orderedLibraries],
  );
  const compareLibs = useMemo(
    () => orderedLibraries.filter((lib) => !lib.isPrimary),
    [orderedLibraries],
  );

  const hasData = scenario !== null && runIndices.length > 0;
  const emptyReason = getEmptyReason(scenario, runIndices, runs);

  const syncToolbarFromChart = useCallback(() => {
    const chart = chartRef.current;
    const initial = initialCategoryViewRef.current;
    const plottedRunCount = runIndices.length;
    if (!chart || !hasData || !initial || plottedRunCount < 2) {
      setToolbarDisabled(ALL_TOOLBAR_DISABLED);
      return;
    }
    setToolbarDisabled(computeChartToolbarDisabled(chart, initial, plottedRunCount));
  }, [hasData, runIndices.length]);

  syncToolbarRef.current = syncToolbarFromChart;

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
      setToolbarDisabled(ALL_TOOLBAR_DISABLED);
      return;
    }

    const existing = Chart.getChart(canvas);
    existing?.destroy();

    const labels = runIndices.map((globalIx) => {
      const run = runs[globalIx];
      return run ? formatLocal(run.timestampIso, run.folder) : "";
    });
    const runsSlice = runIndices.map((globalIx) => runs[globalIx]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datasets: Array<any> = [];

    for (const lib of orderedLibraries) {
      const libData = scenario.libraries[lib.key];
      if (!libData) {
        continue;
      }
      const paletteEntry = paletteMap[lib.key]!;
      const hz = runIndices.map((globalIx) => libData.hz[globalIx] ?? null);

      if (showBands) {
        const p25 = runIndices.map((globalIx) => libData.p25[globalIx] ?? null);
        const p75 = runIndices.map((globalIx) => libData.p75[globalIx] ?? null);
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
        label: `${lib.displayName} hz/op (median)`,
        data: hz,
        borderColor: paletteEntry.border,
        backgroundColor: paletteEntry.band.replace(/[\d.]+\)$/, "0.08)"),
        spanGaps: false,
        yAxisID: "y",
        tension: 0.12,
        order: 5,
      });
    }

    if (showRatio && primaryLib) {
      compareLibs.forEach((cmpLib, compareIndex) => {
        const primData = scenario.libraries[primaryLib.key];
        const cmpData = scenario.libraries[cmpLib.key];
        if (!primData || !cmpData) {
          return;
        }
        const ratioData = runIndices.map((globalIx) =>
          ratioFrom(primData.hz[globalIx], cmpData.hz[globalIx]),
        );
        datasets.push({
          label: `${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
          data: ratioData,
          borderColor: RATIO_COLORS[compareIndex % RATIO_COLORS.length],
          backgroundColor: "rgba(251,191,119,0.08)",
          spanGaps: true,
          yAxisID: "y1",
          tension: 0.12,
          order: 3,
        });
      });
    }

    const pointCount = labels.length;
    initialCategoryViewRef.current = computeInitialCategoryWindow(pointCount);
    const xWindow = categoryXScaleWindow(pointCount);

    const scales: Record<string, object> = {
      x: {
        type: "category",
        offset: true,
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.min(22, Math.max(pointCount || 2, 2)),
          maxRotation: 52,
          minRotation: 0,
          color: "rgba(235, 235, 245, 0.42)",
        },
        grid: { color: "rgba(255, 255, 255, 0.055)", drawOnChartArea: true },
        ...(xWindow ?? {}),
      },
      y: {
        type: useLogScale ? "logarithmic" : "linear",
        position: "left",
        title: { display: true, text: "hz/op", color: "rgba(235, 235, 245, 0.5)" },
        ticks: { color: "rgba(235, 235, 245, 0.42)" },
        grid: { color: "rgba(255, 255, 255, 0.055)" },
      },
    };

    if (showRatio) {
      scales["y1"] = {
        type: "linear",
        position: "right",
        title: { display: true, text: "ratio", color: "rgba(235, 235, 245, 0.5)" },
        ticks: { color: "rgba(255, 200, 150, 0.55)" },
        grid: { drawOnChartArea: false },
      };
    }

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300, easing: "easeOutCubic" },
        interaction: { mode: "index", intersect: false },
        scales,
        plugins: {
          legend: {
            labels: {
              color: "rgba(235, 235, 245, 0.72)",
              filter: (item) => {
                const legendText = item.text ?? "";
                return !legendText.endsWith(" P25") && !legendText.includes("P25–P75");
              },
            },
          },
          tooltip: {
            filter: (item) => {
              const datasetLabel = item.dataset.label ?? "";
              return !datasetLabel.endsWith(" P25") && !datasetLabel.includes("P25–P75");
            },
            callbacks: {
              title: (items) => {
                if (!items.length) {
                  return "";
                }
                const run = runsSlice[items[0]!.dataIndex];
                if (!run) {
                  return "";
                }
                const clock = formatLocal(run.timestampIso, run.folder);
                return clock ? `${clock} (local)\n${run.folder}` : run.folder;
              },
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
                if (ctx.dataset.yAxisID === "y1") {
                  return `${datasetLabel}: ${Number(rawHz).toFixed(3)}×`;
                }
                const matchedLib = orderedLibraries.find((lib) =>
                  datasetLabel.startsWith(lib.displayName),
                );
                let extra = "";
                if (matchedLib) {
                  const libData = scenario.libraries[matchedLib.key];
                  const globalIx = runIndices[ctx.dataIndex];
                  const iqrFraction =
                    globalIx !== undefined ? libData?.iqrFraction[globalIx] : null;
                  if (typeof iqrFraction === "number" && Number.isFinite(iqrFraction)) {
                    extra = ` · IQR ${(iqrFraction * 100).toFixed(1)}%${spreadTierLabel(iqrFraction)}`;
                  }
                }
                return `${datasetLabel}: ${Number(rawHz).toLocaleString("en-US", { maximumFractionDigits: 0 })}${extra}`;
              },
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              onPanComplete: ({ chart: panChart }) => {
                chartRef.current = panChart as Chart;
                queueMicrotask(() => syncToolbarRef.current?.());
              },
            },
            zoom: {
              wheel: { enabled: true, modifierKey: "ctrl" },
              pinch: { enabled: true },
              mode: "x",
              drag: { enabled: false },
              onZoomComplete: ({ chart: zoomChart }) => {
                chartRef.current = zoomChart as Chart;
                queueMicrotask(() => syncToolbarRef.current?.());
              },
            },
            limits: {},
          },
        },
        layout: { padding: { top: 4, right: 12 + (showRatio ? 20 : 0), bottom: 2, left: 12 } },
      },
    });

    requestAnimationFrame(() => {
      chartRef.current?.resize();
      syncToolbarRef.current?.();
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      initialCategoryViewRef.current = null;
      setToolbarDisabled(ALL_TOOLBAR_DISABLED);
    };
  }, [
    scenario,
    runIndices,
    runs,
    orderedLibraries,
    paletteMap,
    showBands,
    useLogScale,
    showRatio,
    primaryLib,
    compareLibs,
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
        syncToolbarRef.current?.();
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  function applyChartAction(
    disabledKey: keyof ChartToolbarDisabled,
    chartAction: (chart: Chart) => void,
  ) {
    const chart = chartRef.current;
    if (!chart || toolbarDisabled[disabledKey]) {
      return;
    }
    chartAction(chart);
    chart.resize();
    chart.update("none");
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
    applyChartAction("reset", (chart) => chart.resetZoom());
  }

  return (
    <section
      aria-labelledby="chart-section-title"
      className="border-bh-border bg-bh-surface overflow-x-clip rounded-[1.25rem] border px-4 py-4 shadow-(--shadow-bh-glass) backdrop-blur-xl backdrop-saturate-180 sm:px-6 sm:py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/6 pb-4">
        <div>
          <h2
            className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-zinc-50"
            id="chart-section-title"
          >
            Throughput over filtered runs
          </h2>
          <p className="mt-1.5 text-[0.8125rem] leading-snug text-zinc-500">
            {hasData ? buildChartSubtitle(scenario, runIndices, baseRunIndices, envKey) : "—"}
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

      <p className="text-[0.8125rem] leading-relaxed text-zinc-500">
        Opens on newest portion of history; Reset zoom restores full range. <WheelHint /> Drag pans
        on the chart · legend toggles series.
      </p>

      <div
        className="relative mt-5 h-[min(32rem,70dvh)] min-h-80 w-full overflow-hidden rounded-2xl bg-black/40 shadow-(--shadow-bh-glass-tight) ring-1 ring-white/8"
        id="bench-chart-host"
      >
        {!hasData && (
          <div
            aria-live="polite"
            className="bg-bh-overlay-soft absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl p-6 text-center backdrop-blur-md"
            id="chart-empty-state"
          >
            <p className="text-bh-meta max-w-[24rem] text-sm leading-normal">{emptyReason}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {envKey && (
                <button
                  className="focus-visible:ring-bh-blue inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 text-sm font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
                  onClick={onClearEnv}
                  type="button"
                >
                  Show all environments
                </button>
              )}
              <button
                className="focus-visible:ring-bh-blue inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 text-sm font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
                onClick={onClearSearch}
                type="button"
              >
                Clear search
              </button>
              <button
                className="focus-visible:ring-bh-blue inline-flex rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 text-sm font-medium text-zinc-100 hover:bg-white/14 focus-visible:ring-2 focus-visible:outline-none"
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
      </div>

      {/* Display toggles — `group` enables group-open: chevron rotation */}
      <details
        className="group mt-1 border-t border-white/6 sm:mt-0 sm:border-t-0"
        ref={displayDetailsRef}
      >
        <summary className="focus-visible:outline-bh-blue flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-2.5 pr-0.5 text-zinc-200 select-none marker:content-[''] focus-visible:outline focus-visible:outline-offset-2 max-sm:-mx-0.5 max-sm:px-1 max-sm:active:bg-white/4 sm:hidden [&::-webkit-details-marker]:hidden">
          <span className="text-bh-label text-[0.65rem] font-semibold tracking-[0.14em] uppercase">
            Display &amp; export
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-zinc-500 transition-transform duration-200 ease-out group-open:rotate-180 sm:hidden" />
        </summary>
        <div className="flex flex-col gap-3 text-[0.9rem] text-zinc-300 max-sm:gap-0 max-sm:divide-y max-sm:divide-white/6 max-sm:overflow-hidden max-sm:rounded-xl max-sm:bg-black/22 max-sm:py-0 max-sm:ring-1 max-sm:ring-white/6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:divide-y-0 sm:pt-4">
          <span className="text-bh-label-muted hidden text-[0.62rem] tracking-[0.12em] sm:inline">
            Display
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg py-0.5 hover:text-zinc-100 max-sm:min-h-11 max-sm:justify-between max-sm:gap-3 max-sm:border-0 max-sm:px-3 max-sm:py-2.5">
            <input
              checked={showBands}
              className="text-bh-blue accent-bh-blue focus:ring-bh-blue/50 size-4 rounded border-white/20 bg-black/30 focus:ring-2 focus:outline-none"
              onChange={(e) => showBandsChange(e.target.checked)}
              title="Per-trial P25–P75 spread around each run median"
              type="checkbox"
            />
            <span>P25–P75 band</span>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg py-0.5 hover:text-zinc-100 max-sm:min-h-11 max-sm:justify-between max-sm:gap-3 max-sm:border-0 max-sm:px-3 max-sm:py-2.5">
            <input
              checked={useLogScale}
              className="text-bh-blue accent-bh-blue focus:ring-bh-blue/50 size-4 rounded border-white/20 bg-black/30 focus:ring-2 focus:outline-none"
              onChange={(e) => logScaleChange(e.target.checked)}
              type="checkbox"
            />
            Log Y axis
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg py-0.5 hover:text-zinc-100 max-sm:min-h-11 max-sm:justify-between max-sm:gap-3 max-sm:border-0 max-sm:px-3 max-sm:py-2.5">
            <input
              checked={showRatio}
              className="text-bh-blue accent-bh-blue focus:ring-bh-blue/50 size-4 rounded border-white/20 bg-black/30 focus:ring-2 focus:outline-none"
              onChange={(e) => showRatioChange(e.target.checked)}
              type="checkbox"
            />
            {primaryLib && compareLibs.length === 1
              ? `Primary ratio (${primaryLib.displayName} ÷ ${compareLibs[0]!.displayName})`
              : "Primary ratios"}
          </label>
          <button
            className="text-bh-ink border-bh-border bg-bh-fill-white-4 shadow-bh-btn-reload hover:text-bh-ink-hover hover:border-bh-border-strong hover:bg-bh-fill-white-7 focus-visible:outline-bh-blue order-last w-full shrink-0 justify-center rounded-xl border px-4 py-2.5 font-[inherit] text-[0.8125rem] font-medium tracking-[-0.015em] backdrop-blur-[0.875rem] backdrop-saturate-160 [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-[0.1875rem] max-sm:mt-0 max-sm:min-h-11 max-sm:rounded-none max-sm:border-0 max-sm:py-3 sm:order-0 sm:ml-auto sm:w-auto sm:py-2"
            id="chart-download-png-btn"
            onClick={() => onDownloadPng(chartRef)}
            title="Capture current chart view as PNG"
            type="button"
          >
            Download PNG
          </button>
        </div>
      </details>

      {/* Tabular data for accessibility */}
      <details
        className="border-bh-border bg-bh-surface open:bg-bh-surface-open mt-6 rounded-2xl border px-4 py-3 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:px-5"
        id="chart-data-details"
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-100 select-none marker:content-[''] hover:text-white [&::-webkit-details-marker]:hidden">
          Tabular data for the current chart (accessibility)
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Same points and libraries as the line chart above; newest run first. Useful for screen
          readers and copy‑paste.
        </p>
        <div className="border-bh-border bg-bh-scrim-table mt-3 overflow-x-auto rounded-xl border [-webkit-overflow-scrolling:touch]">
          <table aria-label="Chart series data" className="w-full border-collapse text-[0.8rem]">
            {hasData && (
              <thead>
                <ChartTableHeader compareLibs={compareLibs} orderedLibraries={orderedLibraries} />
              </thead>
            )}
            <tbody>
              {hasData &&
                runIndices
                  .slice()
                  .reverse()
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
      </details>
    </section>
  );
}

function WheelHint() {
  return (
    <span suppressHydrationWarning>
      {isMacLikePlatform() ? (
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">
          ⌃ Control
        </kbd>
      ) : (
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">
          Ctrl
        </kbd>
      )}
      +wheel zooms ·
    </span>
  );
}

function getEmptyReason(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  runs: ReadonlyArray<EmbeddedRun>,
): string {
  if (runs.length === 0) {
    return "No benchmark runs are in this history yet. Generate data with your bench command, then refresh this page.";
  }
  if (runIndices.length === 0) {
    return "No runs match the selected environment. Widen the filter to see the chart again.";
  }
  if (!scenario) {
    return "Pick a scenario from the Scenario list above.";
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
        <ChartTh className="text-right tabular-nums" key={lib.key} scope="col">
          {lib.displayName} hz/op
        </ChartTh>
      ))}
      {compareLibs.map((cmp) => (
        <ChartTh className="text-bh-ratio-accent text-right tabular-nums" key={cmp.key} scope="col">
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

function ChartTableRow({
  globalIx,
  run,
  scenario,
  orderedLibraries,
  primaryLib,
  compareLibs,
}: ChartTableRowProps) {
  const localClock = formatLocal(run.timestampIso, run.folder);

  const libHzMap: Record<string, number | null> = {};
  for (const lib of orderedLibraries) {
    const hz = scenario.libraries[lib.key]?.hz[globalIx] ?? null;
    libHzMap[lib.key] = typeof hz === "number" && hz > 0 ? hz : null;
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;

  return (
    <tr className="hover:bg-bh-table-hover even:bg-bh-table-zebra even:hover:bg-bh-table-zebra-hover">
      <ChartTd>{localClock}</ChartTd>
      <ChartTd>{run.folder}</ChartTd>
      {orderedLibraries.map((lib) => {
        const hz = libHzMap[lib.key];
        return (
          <ChartTd className="text-right tabular-nums" key={lib.key}>
            {hz !== null ? Number(hz).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}
          </ChartTd>
        );
      })}
      {compareLibs.map((cmp) => {
        const ratio = ratioFrom(primaryHz, libHzMap[cmp.key] ?? null);
        return (
          <ChartTd className="text-right tabular-nums" key={cmp.key}>
            {ratio !== null ? `${ratio.toFixed(3)}×` : "—"}
          </ChartTd>
        );
      })}
    </tr>
  );
}

export type { RefObject };
export type { Chart as ChartInstance };
