import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  EmbeddedLibraryMeta,
  EmbeddedRun,
  EmbeddedScenarioSeries,
} from "#/server/server-types";
import {
  type PaletteEntry,
  PAN_PIXELS_X,
  RATIO_COLORS,
  ZOOM_STEP_X,
} from "#/server/client/lib/colors";
import {
  type ChartToolbarDisabled,
  categoryXScaleWindow,
  computeChartToolbarDisabled,
  computeInitialCategoryWindow,
} from "#/server/client/lib/chart-category-view";
import { formatLocal, spreadTierLabel } from "#/server/client/lib/format";
import { ratioFrom } from "#/server/client/lib/metrics";

// Chart.js is browser-only; import types separately to keep SSR safe.
// The actual module is only evaluated in the browser bundle.
import type { Chart as ChartInstance } from "chart.js";

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
  onDownloadPng: (chartRef: RefObject<ChartInstance | null>) => void;
  showBandsChange: (value: boolean) => void;
  logScaleChange: (value: boolean) => void;
  showRatioChange: (value: boolean) => void;
  subtitle: string;
}

function buildChartSubtitle(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  baseRunIndices: Array<number>,
  envKey: string,
  runWindow: string,
): string {
  if (!scenario || runIndices.length === 0) {
    if (runIndices.length === 0) {
      return "No saved runs match the current Environment filter.";
    }
    return "No scenario available for these filters.";
  }
  let sub = `[${scenario.group}] ${scenario.id} · ${runIndices.length} plotted point(s)`;
  if (envKey) {
    sub += " · environment filter on";
  }
  if (runWindow !== "all" && baseRunIndices.length > runIndices.length) {
    sub += ` · last ${runIndices.length} of ${baseRunIndices.length} matching runs`;
  }
  return sub;
}

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
  const chartRef = useRef<ChartInstance | null>(null);
  const initialCategoryViewRef = useRef<{ max: number; min: number } | null>(null);
  const syncToolbarRef = useRef<(() => void) | undefined>(undefined);

  const [toolbarDisabled, setToolbarDisabled] = useState<ChartToolbarDisabled>({
    earlier: true,
    later: true,
    reset: true,
    zoomIn: true,
    zoomOut: true,
  });

  const primaryLib = useMemo(
    () => orderedLibraries.find((l) => l.isPrimary) ?? orderedLibraries[0],
    [orderedLibraries],
  );
  const compareLibs = useMemo(
    () => orderedLibraries.filter((l) => !l.isPrimary),
    [orderedLibraries],
  );

  const hasData = scenario !== null && runIndices.length > 0;
  const emptyReason = getEmptyReason(scenario, runIndices, runs, envKey);

  const syncToolbarFromChart = useCallback(() => {
    const chart = chartRef.current;
    const initial = initialCategoryViewRef.current;
    const n = runIndices.length;
    if (!chart || !hasData || !initial || n < 2) {
      setToolbarDisabled({
        earlier: true,
        later: true,
        reset: true,
        zoomIn: true,
        zoomOut: true,
      });
      return;
    }
    setToolbarDisabled(computeChartToolbarDisabled(chart, initial, n));
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
      setToolbarDisabled({
        earlier: true,
        later: true,
        reset: true,
        zoomIn: true,
        zoomOut: true,
      });
      return;
    }

    void (async () => {
      const [{ Chart, registerables }, { default: zoomPlugin }] = await Promise.all([
        import("chart.js"),
        import("chartjs-plugin-zoom"),
      ]);
      Chart.register(...registerables, zoomPlugin);

      const existing = Chart.getChart(canvas);
      existing?.destroy();

      const labels = runIndices.map((i) => {
        const run = runs[i];
        return run ? formatLocal(run.timestampIso, run.folder) : "";
      });
      const runsSlice = runIndices.map((i) => runs[i]!);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const datasets: Array<any> = [];

      for (const lib of orderedLibraries) {
        const libData = scenario.libraries[lib.key];
        if (!libData) {
          continue;
        }
        const pal = paletteMap[lib.key]!;
        const hz = runIndices.map((i) => libData.hz[i] ?? null);

        if (showBands) {
          const p25 = runIndices.map((i) => libData.p25[i] ?? null);
          const p75 = runIndices.map((i) => libData.p75[i] ?? null);
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
              backgroundColor: pal.band,
              spanGaps: false,
              yAxisID: "y",
              order: 10,
            },
          );
        }

        datasets.push({
          label: `${lib.displayName} hz/op (median)`,
          data: hz,
          borderColor: pal.border,
          backgroundColor: pal.band.replace(/[\d.]+\)$/, "0.08)"),
          spanGaps: false,
          yAxisID: "y",
          tension: 0.12,
          order: 5,
        });
      }

      if (showRatio && primaryLib) {
        compareLibs.forEach((cmpLib, ci) => {
          const primData = scenario.libraries[primaryLib.key];
          const cmpData = scenario.libraries[cmpLib.key];
          if (!primData || !cmpData) {
            return;
          }
          const ratioData = runIndices.map((i) => ratioFrom(primData.hz[i], cmpData.hz[i]));
          datasets.push({
            label: `${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
            data: ratioData,
            borderColor: RATIO_COLORS[ci % RATIO_COLORS.length],
            backgroundColor: "rgba(251,191,119,0.08)",
            spanGaps: true,
            yAxisID: "y1",
            tension: 0.12,
            order: 3,
          });
        });
      }

      const L = labels.length;
      initialCategoryViewRef.current = computeInitialCategoryWindow(L);
      const xWindow = categoryXScaleWindow(L);

      const scales: Record<string, object> = {
        x: {
          type: "category",
          offset: true,
          ticks: {
            autoSkip: true,
            maxTicksLimit: Math.min(22, Math.max(L || 2, 2)),
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
                  const t = item.text ?? "";
                  return !t.endsWith(" P25") && !t.includes("P25–P75");
                },
              },
            },
            tooltip: {
              filter: (item) => {
                const t = item.dataset.label ?? "";
                return !t.endsWith(" P25") && !t.includes("P25–P75");
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
                    .map((lv) => `${lv.key} ${lv.version}${lv.gcExposed ? " [gc]" : ""}`)
                    .join(" · ");
                  return [
                    `${run.cpuModel} · ${run.platform}/${run.arch}`,
                    `Node ${run.nodeVersion} · V8 ${run.v8Version}`,
                    verLine,
                  ].join("\n");
                },
                label: (ctx) => {
                  const v = ctx.raw as number | null;
                  const lbl = ctx.dataset.label ?? "";
                  if (lbl.includes("P25–P75") || lbl.endsWith(" P25")) {
                    return undefined;
                  }
                  if (v === null || v === undefined) {
                    return `${lbl}: —`;
                  }
                  if (ctx.dataset.yAxisID === "y1") {
                    return `${lbl}: ${Number(v).toFixed(3)}×`;
                  }
                  const matchedLib = orderedLibraries.find((lib) =>
                    lbl.startsWith(lib.displayName),
                  );
                  let extra = "";
                  if (matchedLib) {
                    const libData = scenario.libraries[matchedLib.key];
                    const globalIx = runIndices[ctx.dataIndex];
                    const f = globalIx !== undefined ? libData?.iqrFraction[globalIx] : null;
                    if (typeof f === "number" && Number.isFinite(f)) {
                      extra = ` · IQR ${(f * 100).toFixed(1)}%${spreadTierLabel(f)}`;
                    }
                  }
                  return `${lbl}: ${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}${extra}`;
                },
              },
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
                onPanComplete: ({ chart: panChart }) => {
                  chartRef.current = panChart as ChartInstance;
                  queueMicrotask(() => syncToolbarRef.current?.());
                },
              },
              zoom: {
                wheel: { enabled: true, modifierKey: "ctrl" },
                pinch: { enabled: true },
                mode: "x",
                drag: { enabled: false },
                onZoomComplete: ({ chart: zoomChart }) => {
                  chartRef.current = zoomChart as ChartInstance;
                  queueMicrotask(() => syncToolbarRef.current?.());
                },
              },
              limits: {},
            },
          },
          layout: { padding: { top: 4, right: 12 + (showRatio ? 20 : 0), bottom: 2, left: 12 } },
        },
      }) as ChartInstance;

      requestAnimationFrame(() => {
        chartRef.current?.resize();
        syncToolbarRef.current?.();
      });
    })();

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      initialCategoryViewRef.current = null;
      setToolbarDisabled({
        earlier: true,
        later: true,
        reset: true,
        zoomIn: true,
        zoomOut: true,
      });
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
    const el = displayDetailsRef.current;
    if (!el) {
      return;
    }
    const mql = window.matchMedia("(min-width: 640px)");
    if (mql.matches) {
      el.open = true;
    }
    const onChange = (e: MediaQueryListEvent) => {
      el.open = e.matches;
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function handleZoomIn() {
    const c = chartRef.current;
    if (!c || toolbarDisabled.zoomIn) {
      return;
    }
    c.zoom({ x: ZOOM_STEP_X }, "none");
    c.resize();
    c.update("none");
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  function handleZoomOut() {
    const c = chartRef.current;
    if (!c || toolbarDisabled.zoomOut) {
      return;
    }
    c.zoom({ x: 1 / ZOOM_STEP_X }, "none");
    c.resize();
    c.update("none");
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  function handlePanEarlier() {
    const c = chartRef.current;
    if (!c || toolbarDisabled.earlier) {
      return;
    }
    c.pan({ x: PAN_PIXELS_X }, undefined, "none");
    c.resize();
    c.update("none");
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  function handlePanLater() {
    const c = chartRef.current;
    if (!c || toolbarDisabled.later) {
      return;
    }
    c.pan({ x: -PAN_PIXELS_X }, undefined, "none");
    c.resize();
    c.update("none");
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  function handleResetZoom() {
    const c = chartRef.current;
    if (!c || toolbarDisabled.reset) {
      return;
    }
    c.resetZoom();
    c.resize();
    c.update("none");
    requestAnimationFrame(() => syncToolbarFromChart());
  }

  // Tabular data for accessibility
  const tableRows = buildTableRows(scenario, runIndices, runs, orderedLibraries, primaryLib);

  return (
    <section aria-labelledby="chart-section-title" className="bh-chart-main-section bh-glass">
      <div className="bh-chart-main-section__head">
        <div>
          <h2 className="bh-chart__heading" id="chart-section-title">
            Throughput over filtered runs
          </h2>
          <p className="bh-chart__tagline">
            {hasData
              ? buildChartSubtitle(scenario, runIndices, baseRunIndices, envKey, "all")
              : "—"}
          </p>
        </div>
      </div>

      <div
        aria-label="Chart pan and zoom"
        className="bh-chart-toolbar bh-chart-toolbar--row"
        role="toolbar"
      >
        <button
          className="bh-seg-btn"
          disabled={toolbarDisabled.zoomIn}
          onClick={handleZoomIn}
          title={toolbarDisabled.zoomIn ? "Already at maximum zoom for this range" : undefined}
          type="button"
        >
          Zoom +
        </button>
        <button
          className="bh-seg-btn"
          disabled={toolbarDisabled.zoomOut}
          onClick={handleZoomOut}
          title={toolbarDisabled.zoomOut ? "Showing the full run history on the chart" : undefined}
          type="button"
        >
          Zoom −
        </button>
        <button
          className="bh-seg-btn"
          disabled={toolbarDisabled.earlier}
          onClick={handlePanEarlier}
          title={toolbarDisabled.earlier ? "Already showing the earliest runs" : undefined}
          type="button"
        >
          ← Earlier
        </button>
        <button
          className="bh-seg-btn"
          disabled={toolbarDisabled.later}
          onClick={handlePanLater}
          title={toolbarDisabled.later ? "Already showing the newest runs" : undefined}
          type="button"
        >
          Later →
        </button>
        <button
          className="bh-seg-btn"
          disabled={toolbarDisabled.reset}
          id="chart-reset-zoom-btn"
          onClick={handleResetZoom}
          title={toolbarDisabled.reset ? "Chart is already at the default time window" : undefined}
          type="button"
        >
          Reset zoom
        </button>
      </div>

      <p className="bh-chart__hint">
        Opens on newest portion of history; Reset zoom restores full range. <WheelHint /> Drag pans
        on the chart · legend toggles series.
      </p>

      <div className="bh-chart__host bh-chart__host--hero" id="bench-chart-host">
        {!hasData && (
          <div aria-live="polite" className="is-visible" id="chart-empty-state">
            <p>{emptyReason}</p>
            <div className="bh-chart__empty-actions">
              {envKey && (
                <button
                  className="bh-empty-action-btn"
                  onClick={onClearEnv}
                  style={{ display: "inline-flex" }}
                  type="button"
                >
                  Show all environments
                </button>
              )}
              <button
                className="bh-empty-action-btn"
                onClick={onClearSearch}
                style={{ display: "inline-flex" }}
                type="button"
              >
                Clear search
              </button>
              <button
                className="bh-empty-action-btn"
                onClick={onClearGroup}
                style={{ display: "inline-flex" }}
                type="button"
              >
                All groups
              </button>
            </div>
          </div>
        )}
        <canvas
          aria-label="Throughput over time chart"
          className="bh-chart__canvas"
          id="bench-chart"
          ref={canvasRef}
        />
      </div>

      {/* Display toggles */}
      <details className="bh-chart-display-details" ref={displayDetailsRef}>
        <summary className="bh-focus bh-chart-display-details__summary">
          <span className="bh-chart-display-details__summary-text">Display &amp; export</span>
          <svg
            aria-hidden="true"
            className="bh-chart-display-details__chevron"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="bh-chart-display-details__body">
          <span className="bh-chart-display-details__desk-label bh-section-title bh-section-title--inline">
            Display
          </span>
          <label className="bh-toggle__label">
            <input
              checked={showBands}
              className="bh-toggle__input"
              onChange={(e) => showBandsChange(e.target.checked)}
              title="Per-trial P25–P75 spread around each run median"
              type="checkbox"
            />
            <span>P25–P75 band</span>
          </label>
          <label className="bh-toggle__label">
            <input
              checked={useLogScale}
              className="bh-toggle__input"
              onChange={(e) => logScaleChange(e.target.checked)}
              type="checkbox"
            />
            Log Y axis
          </label>
          <label className="bh-toggle__label">
            <input
              checked={showRatio}
              className="bh-toggle__input"
              onChange={(e) => showRatioChange(e.target.checked)}
              type="checkbox"
            />
            {primaryLib && compareLibs.length > 0
              ? compareLibs.length === 1
                ? `Primary ratio (${primaryLib.displayName} ÷ ${compareLibs[0]!.displayName})`
                : "Primary ratios"
              : "Primary ratios"}
          </label>
          <button
            className="bh-btn-download-png"
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
      <details className="bh-chart-data-details" id="chart-data-details">
        <summary className="bh-details-summary bh-details-summary--prominent">
          Tabular data for the current chart (accessibility)
        </summary>
        <p className="bh-chart__prose">
          Same points and libraries as the line chart above; newest run first. Useful for screen
          readers and copy‑paste.
        </p>
        <div className="bh-chart-data-table-wrap">
          <table aria-label="Chart series data" className="bh-table bh-table--zebra">
            {tableRows.header && (
              <thead>
                <tr dangerouslySetInnerHTML={{ __html: tableRows.header }} />
              </thead>
            )}
            <tbody>
              {tableRows.body.map((row, i) => (
                <tr dangerouslySetInnerHTML={{ __html: row }} key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function WheelHint() {
  const isMac =
    typeof navigator !== "undefined" &&
    (/Mac|iPhone|iPod|iPad/i.test(navigator.platform ?? "") ||
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
        ?.platform === "macOS");
  return (
    <span suppressHydrationWarning>
      {isMac ? <kbd className="bh-kbd">⌃ Control</kbd> : <kbd className="bh-kbd">Ctrl</kbd>}
      +wheel zooms ·
    </span>
  );
}

function getEmptyReason(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  runs: ReadonlyArray<EmbeddedRun>,
  _envKey: string,
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

interface TableRows {
  header: string;
  body: Array<string>;
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTableRows(
  scenario: EmbeddedScenarioSeries | null,
  runIndices: Array<number>,
  runs: ReadonlyArray<EmbeddedRun>,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  primaryLib: EmbeddedLibraryMeta | undefined,
): TableRows {
  if (!scenario || runIndices.length === 0) {
    return { header: "", body: [] };
  }

  const compareLibs = orderedLibraries.filter((l) => !l.isPrimary);

  let header = "<th scope='col'>Run (local)</th><th scope='col'>Folder</th>";
  for (const lib of orderedLibraries) {
    header += `<th scope='col' class='bh-num'>${escHtml(lib.displayName)} hz/op</th>`;
  }
  for (const cmp of compareLibs) {
    header += `<th scope='col' class='bh-num text-bh-ratio-accent'>÷ ${escHtml(cmp.displayName)}</th>`;
  }

  const body: Array<string> = [];
  for (let j = runIndices.length - 1; j >= 0; j--) {
    const globalIx = runIndices[j]!;
    const run = runs[globalIx];
    if (!run) {
      continue;
    }
    const localClock = formatLocal(run.timestampIso, run.folder);
    let row = `<td>${escHtml(localClock)}</td><td>${escHtml(run.folder)}</td>`;

    const libHzMap: Record<string, number | null> = {};
    for (const lib of orderedLibraries) {
      const hz = scenario.libraries[lib.key]?.hz[globalIx] ?? null;
      libHzMap[lib.key] = typeof hz === "number" && hz > 0 ? hz : null;
      const val = libHzMap[lib.key];
      row += `<td class='bh-num'>${val !== null ? escHtml(Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 })) : "—"}</td>`;
    }

    const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;
    for (const cmp of compareLibs) {
      const cmpHz = libHzMap[cmp.key] ?? null;
      const ratio = ratioFrom(primaryHz, cmpHz);
      row += `<td class='bh-num'>${ratio !== null ? ratio.toFixed(3) + "×" : "—"}</td>`;
    }

    body.push(row);
  }

  return { header, body };
}

export type { RefObject };
export type { ChartInstance };
