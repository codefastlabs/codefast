import { type RefObject, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "#/client/components/chart-panel";
import { ChartPanel } from "#/client/components/chart-panel";
import { CommandPalette } from "#/client/components/command-palette";
import { FindPanel } from "#/client/components/find-panel";
import { MetricsPanel } from "#/client/components/metrics-panel";
import { ClientPageOpenedClock, ClientSnapshotClock } from "#/client/components/page-footer-clocks";
import { useBenchPayload } from "#/client/hooks/use-bench-payload";
import { useHashSync } from "#/client/hooks/use-hash-sync";
import { useViewState } from "#/client/hooks/use-view-state";
import { PALETTE, type PaletteEntry } from "#/client/lib/colors";
import { formatLocal, searchNorm } from "#/client/lib/format";
import { buildHash, type ViewState } from "#/client/lib/hash";
import { buildMetrics, buildSnapshotRow } from "#/client/lib/metrics";
import type {
  EmbeddedLibraryMeta,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/server-types";

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.1
 */
export function App({ initialPayload }: { initialPayload?: EmbeddedViewerPayload }) {
  const { view, patchView } = useViewState(initialPayload);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const paletteInputRef = useRef<HTMLInputElement>(null);

  function showToast(message: string) {
    setToastMsg(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }

  const { payload, loadError, isReloading, loadData } = useBenchPayload({
    initialPayload,
    onReloadError: showToast,
  });

  useHashSync({ payload, view, patchView });

  // ─── Derived state ──────────────────────────────────────────────────────────

  const { orderedLibraries, paletteMap } = useMemo<{
    orderedLibraries: Array<EmbeddedLibraryMeta>;
    paletteMap: Record<string, PaletteEntry>;
  }>(() => {
    if (!payload) {
      return { orderedLibraries: [], paletteMap: {} };
    }
    const primary = payload.libraries.find((l) => l.isPrimary) ?? payload.libraries[0];
    const compares = payload.libraries.filter((l) => !l.isPrimary);
    const ordered: Array<EmbeddedLibraryMeta> = primary
      ? [primary, ...compares]
      : [...payload.libraries];
    const map: Record<string, PaletteEntry> = {};
    ordered.forEach((lib, i) => {
      map[lib.key] = PALETTE[i % PALETTE.length]!;
    });
    return { orderedLibraries: ordered, paletteMap: map };
  }, [payload]);

  const visibleScenarios = useMemo<Array<EmbeddedScenarioSeries>>(() => {
    if (!payload) {
      return [];
    }
    const q = searchNorm(view.search).trim();
    return payload.scenarios.filter((s) => {
      if (view.group && s.group !== view.group) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        searchNorm(s.id).includes(q) ||
        searchNorm(s.group).includes(q) ||
        searchNorm(s.what).includes(q)
      );
    });
  }, [payload, view.group, view.search]);

  const baseRunIndices = useMemo<Array<number>>(() => {
    if (!payload) {
      return [];
    }
    if (!view.envKey) {
      return payload.runs.map((_, i) => i);
    }
    return payload.runs.reduce<Array<number>>((acc, r, i) => {
      if (r.envKey === view.envKey) {
        acc.push(i);
      }
      return acc;
    }, []);
  }, [payload, view.envKey]);

  const runIndices = useMemo<Array<number>>(() => {
    if (view.runWindow === "all" || baseRunIndices.length === 0) {
      return baseRunIndices;
    }
    const n = parseInt(view.runWindow, 10);
    if (!Number.isFinite(n) || n < 1) {
      return baseRunIndices;
    }
    return baseRunIndices.length <= n
      ? baseRunIndices
      : baseRunIndices.slice(baseRunIndices.length - n);
  }, [baseRunIndices, view.runWindow]);

  const currentScenario = useMemo<EmbeddedScenarioSeries | null>(() => {
    if (!payload) {
      return null;
    }
    return payload.scenarios.find((s) => s.id === view.scenarioId) ?? null;
  }, [payload, view.scenarioId]);

  const uniqueEnvKeys = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.runs.map((r) => r.envKey))].sort((a, b) => a.localeCompare(b));
  }, [payload]);

  const uniqueGroups = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.scenarios.map((s) => s.group))].sort((a, b) => a.localeCompare(b));
  }, [payload]);

  const showMultiEnvBanner = uniqueEnvKeys.length > 1 && !view.envKey;

  const primaryLib = useMemo(
    () => orderedLibraries.find((l) => l.isPrimary) ?? orderedLibraries[0],
    [orderedLibraries],
  );
  const compareLibs = useMemo(
    () => orderedLibraries.filter((l) => !l.isPrimary),
    [orderedLibraries],
  );

  // ─── Auto-select first visible scenario when filters change ────────────────

  useEffect(() => {
    if (!payload || visibleScenarios.length === 0) {
      return;
    }
    const isVisible = visibleScenarios.some((s) => s.id === view.scenarioId);
    if (!isVisible) {
      patchView({ scenarioId: visibleScenarios[0]?.id ?? "" });
    }
  }, [payload, visibleScenarios, view.scenarioId, patchView]);

  // ─── details persistence via localStorage ──────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const items = [
      { id: "intro-howto-details", key: "bh-howto-open" },
      { id: "chart-data-details", key: "bh-chartdata-open" },
      { id: "snapshot-details", key: "bh-snapshot-open" },
    ];
    const cleanups: Array<() => void> = [];
    for (const cfg of items) {
      const el = document.getElementById(cfg.id) as HTMLDetailsElement | null;
      if (!el) {
        continue;
      }
      try {
        if (localStorage.getItem(cfg.key) === "1") {
          el.open = true;
        }
      } catch {
        /* ignore */
      }
      const handler = () => {
        try {
          localStorage.setItem(cfg.key, el.open ? "1" : "0");
        } catch {
          /* ignore */
        }
      };
      el.addEventListener("toggle", handler);
      cleanups.push(() => el.removeEventListener("toggle", handler));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [payload]);

  // ─── Command palette keyboard shortcut ─────────────────────────────────────

  const onBenchGlobalKeydown = useEffectEvent((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setCommandPaletteOpen((open) => {
        if (!open) {
          setPaletteQuery("");
        }
        return !open;
      });
      return;
    }
    if (e.key === "Escape" && commandPaletteOpen) {
      setCommandPaletteOpen(false);
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("keydown", onBenchGlobalKeydown);
    return () => window.removeEventListener("keydown", onBenchGlobalKeydown);
  }, []);

  useEffect(() => {
    if (commandPaletteOpen) {
      paletteInputRef.current?.focus();
    }
  }, [commandPaletteOpen]);

  // ─── PNG export ─────────────────────────────────────────────────────────────

  function handleDownloadPng(chartRef: RefObject<ChartInstance | null>) {
    const chart = chartRef.current;
    if (!chart) {
      showToast("Nothing to export yet — select a scenario with plotted runs.");
      return;
    }
    const sid = String(view.scenarioId || "chart").replace(/[^a-zA-Z0-9_.-]+/g, "_");
    const filename = `bench-history-${sid}.png`;
    const a = document.createElement("a");
    a.download = filename;
    a.href = (
      chart as ChartInstance & { toBase64Image: (type: string, quality: number) => string }
    ).toBase64Image("image/png", 1);
    a.click();
    showToast(`Saved ${filename}`);
  }

  // ─── Copy link ──────────────────────────────────────────────────────────────

  function copyViewLink() {
    const hash = buildHash(view);
    const url = window.location.origin + window.location.pathname + (hash ? `#${hash}` : "");
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(
        () => showToast("Link copied"),
        () => showToast("Could not copy"),
      );
    } else {
      showToast("Clipboard unavailable");
    }
  }

  // ─── Command palette actions ────────────────────────────────────────────────

  const scenarioIndex = visibleScenarios.findIndex((s) => s.id === view.scenarioId);

  function runPaletteCommand(id: string) {
    setCommandPaletteOpen(false);
    switch (id) {
      case "reload-data":
        void loadData(true);
        break;
      case "focus-search":
        document.getElementById("scenario-search")?.focus();
        break;
      case "scenario-next":
        if (scenarioIndex < visibleScenarios.length - 1) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
        }
        break;
      case "scenario-prev":
        if (scenarioIndex > 0) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
        }
        break;
      case "toggle-bands":
        patchView({ showBands: !view.showBands });
        break;
      case "toggle-log":
        patchView({ useLogScale: !view.useLogScale });
        break;
      case "toggle-ratio":
        patchView({ showRatio: !view.showRatio });
        break;
      case "reset-zoom":
        document.getElementById("chart-reset-zoom-btn")?.click();
        break;
      case "download-png":
        document.getElementById("chart-download-png-btn")?.click();
        break;
      case "copy-link":
        copyViewLink();
        break;
    }
  }

  const paletteActions = useMemo(
    () => [
      { id: "reload-data", label: "Reload bench data from server" },
      { id: "focus-search", label: "Focus scenario search" },
      { id: "scenario-next", label: "Next scenario" },
      { id: "scenario-prev", label: "Previous scenario" },
      { id: "toggle-bands", label: "Toggle P25–P75 band" },
      { id: "toggle-log", label: "Toggle log Y axis" },
      { id: "toggle-ratio", label: "Toggle primary ratios" },
      { id: "reset-zoom", label: "Reset chart zoom" },
      { id: "download-png", label: "Download chart as PNG" },
      { id: "copy-link", label: "Copy link to this view" },
    ],
    [],
  );

  // ─── Metrics ────────────────────────────────────────────────────────────────

  const metricsData = useMemo(() => {
    if (!currentScenario || runIndices.length === 0) {
      return null;
    }
    return buildMetrics(
      currentScenario,
      runIndices,
      orderedLibraries,
      paletteMap,
      primaryLib,
      compareLibs,
      baseRunIndices,
      view.envKey,
      view.runWindow,
    );
  }, [
    currentScenario,
    runIndices,
    orderedLibraries,
    paletteMap,
    primaryLib,
    compareLibs,
    baseRunIndices,
    view.envKey,
    view.runWindow,
  ]);

  // ─── Snapshot table ─────────────────────────────────────────────────────────

  const snapshotRows = useMemo(() => {
    if (!payload || payload.runs.length === 0) {
      return [];
    }
    const lastIx = payload.runs.length - 1;
    return payload.scenarios.map((s) =>
      buildSnapshotRow(s, lastIx, orderedLibraries, paletteMap, primaryLib, compareLibs),
    );
  }, [payload, orderedLibraries, paletteMap, primaryLib, compareLibs]);

  // ─── No payload (initial load) ─────────────────────────────────────────────

  if (!payload) {
    return (
      <>
        <a className="bh-skip-link" href="#bench-chart-host">
          Skip to chart
        </a>
        <div aria-live="polite" id="loading-overlay" role="status">
          {loadError ? (
            <div className="bh-error">
              <p className="bh-error__title">Failed to load bench data.</p>
              <p className="bh-error__detail">{loadError}</p>
              <p className="bh-error__hint">
                Run <code className="bh-error__code">pnpm bench</code> first to generate data.
              </p>
            </div>
          ) : (
            <div className="bh-loading__stack">
              <div className="bh-spinner bh-spinner--ring" />
              <p className="bh-loading__text">Loading bench data…</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const latestRun: EmbeddedRun | undefined = payload.runs[payload.runs.length - 1];

  return (
    <>
      <a className="bh-skip-link" href="#bench-chart-host">
        Skip to chart
      </a>

      <main className="bh-app-shell" id="app">
        {/* Header */}
        <header className="bh-page-header">
          <p className="bh-eyebrow">Bench history viewer</p>
          <h1 className="bh-page-title">
            {payload.title}
            <span className="bh-title-suffix"> · hz/op median per run</span>
          </h1>
          <div className="bh-header-lede-row">
            <p className="bh-lede">
              Median hz/op per saved run, optional P25–P75 bands, and primary-vs-compare ratios.{" "}
              <span className="bh-lede__muted">Press</span> <kbd className="bh-kbd">⌘K</kbd>{" "}
              <span className="bh-lede__muted">or</span> <kbd className="bh-kbd">Ctrl+K</kbd>{" "}
              <span className="bh-lede__muted">for quick actions.</span>
            </p>
            <div className="bh-header-actions">
              <button
                aria-label="Copy link to this view"
                className="bh-btn-reload"
                onClick={copyViewLink}
                title="Copies URL including filters, scenario, and display toggles"
                type="button"
              >
                Copy link
              </button>
            </div>
          </div>
          <details className="bh-glass bh-glass--tight bh-howto" id="intro-howto-details">
            <summary className="bh-details-summary bh-details-summary--prominent">
              How to read this viewer
            </summary>
            <div className="bh-howto__prose">
              <p>
                Quantiles mirror <code className="bh-inline-code">report.ts</code> across trials.
                Bands are per‑trial hz/op spread (P25–P75); tooltip IQR% and a dispersion hint
                highlight noisy runs. Axis labels use your{" "}
                <strong className="bh-prose-emphasis">local time</strong>. Toggle{" "}
                <strong className="bh-prose-emphasis">Primary ratios</strong> to overlay primary ÷
                compare on the right axis. Use{" "}
                <strong className="bh-prose-emphasis">Runs shown</strong> to focus on the most
                recent history window.
              </p>
            </div>
          </details>
        </header>

        {/* Bench results dir diagnostic */}
        {payload.benchResultsWarning !== undefined && payload.benchResultsWarning.length > 0 && (
          <div className="bh-env-banner" role="alert" style={{ display: "block" }}>
            <strong className="bh-env-banner__title">Bench results directory.</strong>{" "}
            {payload.benchResultsWarning}
          </div>
        )}

        {/* Multi-env banner */}
        {showMultiEnvBanner && (
          <div className="bh-env-banner" role="status" style={{ display: "block" }}>
            <strong className="bh-env-banner__title">Multiple environments in history.</strong>{" "}
            Prefer an Environment filter before comparing regimes (CPU × Node fingerprints differ
            across machines).
          </div>
        )}

        {/* Scenario finder */}
        <FindPanel
          group={view.group}
          onGroupChange={(v) => patchView({ group: v })}
          onSearchChange={(v) => patchView({ search: v })}
          search={view.search}
          uniqueGroups={uniqueGroups}
        />

        {/* Chart control panel */}
        <div aria-label="Chart data selection" className="bh-chart-control-panel bh-glass--sticky">
          <div className="bh-chart-control-panel__head">
            <p className="bh-section-title">Chart data</p>
            <button
              aria-busy={isReloading}
              aria-label="Reload benchmark data from server"
              className="bh-btn-reload"
              disabled={isReloading}
              onClick={() => void loadData(true)}
              title="Fetch the latest runs from the server without refreshing the page"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="bh-btn-reload__icon"
                fill="none"
                height="14"
                viewBox="0 0 24 24"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Reload data
            </button>
          </div>
          <div className="bh-chart-control-panel__fields">
            <div className="bh-chart-control-panel__scenario">
              <label className="bh-label-wrap--scenario">
                <span className="bh-field-label">Scenario</span>
                <select
                  aria-label="Benchmark scenario"
                  className="bh-focus bh-field bh-field--chart-select"
                  onChange={(e) => patchView({ scenarioId: e.target.value })}
                  value={view.scenarioId}
                >
                  {visibleScenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.group}] {s.id}
                    </option>
                  ))}
                </select>
              </label>
              <div
                aria-label="Previous or next scenario in the filtered list"
                className="bh-chart-toolbar bh-chart-toolbar--match-field bh-chart-toolbar--scenario-nav"
                role="group"
              >
                <button
                  aria-label="Previous scenario"
                  className="bh-seg-btn"
                  disabled={scenarioIndex <= 0}
                  onClick={() => {
                    if (scenarioIndex > 0) {
                      patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
                    }
                  }}
                  title="Previous scenario in filtered list"
                  type="button"
                >
                  ← Prev
                </button>
                <button
                  aria-label="Next scenario"
                  className="bh-seg-btn"
                  disabled={scenarioIndex >= visibleScenarios.length - 1}
                  onClick={() => {
                    if (scenarioIndex < visibleScenarios.length - 1) {
                      patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
                    }
                  }}
                  title="Next scenario in filtered list"
                  type="button"
                >
                  Next →
                </button>
              </div>
            </div>
            <label className="bh-label-wrap--env">
              <span className="bh-field-label">Environment</span>
              <select
                aria-label="Filter runs by CPU and Node"
                className="bh-focus bh-field bh-field--chart-select"
                onChange={(e) => patchView({ envKey: e.target.value })}
                value={view.envKey}
              >
                <option value="">All runs</option>
                {uniqueEnvKeys.map((key) => {
                  const sample = payload.runs.find((r) => r.envKey === key);
                  return (
                    <option key={key} value={key}>
                      {sample?.envLabel ?? key}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="bh-label-wrap--window">
              <span className="bh-field-label">Runs shown</span>
              <select
                aria-label="Limit chart to the most recent runs"
                className="bh-focus bh-field bh-field--chart-select"
                onChange={(e) => patchView({ runWindow: e.target.value as ViewState["runWindow"] })}
                title="After Environment filter, only the newest N runs are plotted"
                value={view.runWindow}
              >
                <option value="all">All matching runs</option>
                <option value="20">Last 20 runs</option>
                <option value="10">Last 10 runs</option>
              </select>
            </label>
          </div>
        </div>

        {/* Chart section */}
        <ChartPanel
          baseRunIndices={baseRunIndices}
          envKey={view.envKey}
          logScaleChange={(v) => patchView({ useLogScale: v })}
          onClearEnv={() => patchView({ envKey: "" })}
          onClearGroup={() => patchView({ group: "" })}
          onClearSearch={() => patchView({ search: "" })}
          onDownloadPng={handleDownloadPng}
          orderedLibraries={orderedLibraries}
          paletteMap={paletteMap}
          runIndices={runIndices}
          runs={payload.runs}
          scenario={currentScenario}
          showBands={view.showBands}
          showBandsChange={(v) => patchView({ showBands: v })}
          showRatio={view.showRatio}
          showRatioChange={(v) => patchView({ showRatio: v })}
          useLogScale={view.useLogScale}
        />

        {/* Metrics panel */}
        <MetricsPanel
          currentScenario={currentScenario}
          metricsData={metricsData}
          runIndices={runIndices}
        />

        {/* History KPIs */}
        <div aria-label="History overview" className="bh-kpi-grid">
          <div className="bh-card">
            <div className="bh-lbl">Saved runs</div>
            <div className="bh-val bh-kpi-val--primary">{payload.runs.length}</div>
          </div>
          <div className="bh-card">
            <div className="bh-lbl">Scenarios tracked</div>
            <div className="bh-val bh-kpi-val--primary">{payload.scenarios.length}</div>
          </div>
          <div className="bh-card bh-kpi-card--wide-sm">
            <div className="bh-lbl">Newest saved run · local clock</div>
            <div className="bh-val bh-kpi-val--secondary" suppressHydrationWarning>
              {latestRun
                ? (() => {
                    const clock = formatLocal(latestRun.timestampIso, latestRun.folder);
                    return clock ? `${clock} · folder ${latestRun.folder}` : latestRun.folder;
                  })()
                : "—"}
            </div>
          </div>
          <div className="bh-card bh-kpi-card--standard-xl">
            <div className="bh-lbl">Library builds (latest run)</div>
            <div className="bh-val bh-kpi-val--meta">
              {latestRun?.libraryVersions?.length
                ? latestRun.libraryVersions.map((lv) => (
                    <div className="bh-lib-version__row" key={lv.key}>
                      <span className="bh-lib-version__key">{lv.key}</span> {lv.version}
                      {lv.gcExposed && (
                        <span className="bh-gc-tag" title="--expose-gc active">
                          {" "}
                          [gc]
                        </span>
                      )}
                    </div>
                  ))
                : "—"}
            </div>
          </div>
        </div>

        {/* Snapshot table */}
        <details className="bh-snapshot-details" id="snapshot-details">
          <summary className="bh-details-summary bh-details-summary--dense">
            Snapshot of <span className="bh-snapshot__accent">globally newest</span> bench folder —
            throughput by scenario (table)
          </summary>
          <p className="bh-snapshot__desc" id="snapshot-desc">
            Rows use the chronologically last run directory ({payload.runs.length} total),
            independent of the Environment selector.
          </p>
          <div className="bh-table-wrap">
            <table
              aria-label="Latest run throughput by scenario"
              className="bh-table bh-table--zebra"
            >
              <thead>
                <tr>
                  <th className="bh-sticky-1" scope="col">
                    Scenario
                  </th>
                  <th className="bh-sticky-2" scope="col">
                    Group
                  </th>
                  {orderedLibraries.map((lib) => (
                    <th
                      className="bh-num"
                      key={lib.key}
                      scope="col"
                      style={{ color: paletteMap[lib.key]?.text }}
                    >
                      {lib.displayName}
                    </th>
                  ))}
                  {compareLibs.map((cmp) => (
                    <th className="bh-num text-bh-ratio-accent" key={cmp.key} scope="col">
                      ÷ {cmp.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshotRows.map((row) => (
                  <tr key={row.id}>
                    <td className="bh-sticky-1">{row.id}</td>
                    <td className="bh-sticky-2">{row.group}</td>
                    {row.hzCells.map((cell, i) => (
                      <td className="bh-num" key={i}>
                        {cell}
                      </td>
                    ))}
                    {row.ratioCells.map((cell, i) => (
                      <td className="bh-num" key={i}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {latestRun && (
            <div className="bh-snapshot__meta" suppressHydrationWarning>
              Folder {latestRun.folder} · {formatLocal(latestRun.timestampIso, latestRun.folder)}{" "}
              (local)
            </div>
          )}
        </details>

        {/* Footer */}
        <p className="bh-page-footer">
          Reload data from Chart data or refresh the page for the latest snapshot ·{" "}
          {payload.runs.length} runs · {payload.scenarios.length} scenarios.
          {payload.generatedAtIso ? (
            <>
              {" "}
              <ClientSnapshotClock iso={payload.generatedAtIso} />
            </>
          ) : null}{" "}
          <ClientPageOpenedClock />
        </p>
      </main>

      {/* Command palette */}
      <CommandPalette
        actions={paletteActions}
        inputRef={paletteInputRef}
        isOpen={commandPaletteOpen}
        onAction={runPaletteCommand}
        onClose={() => setCommandPaletteOpen(false)}
        onQueryChange={setPaletteQuery}
        query={paletteQuery}
      />

      {/* Toast */}
      <div
        aria-atomic="true"
        aria-live="polite"
        className={toastMsg ? "is-visible" : undefined}
        id="bh-toast"
        role="status"
      >
        {toastMsg}
      </div>
    </>
  );
}
