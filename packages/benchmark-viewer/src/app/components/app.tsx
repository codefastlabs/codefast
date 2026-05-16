import { type RefObject, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "#/app/components/chart";
import { ChartPanel } from "#/app/components/chart";
import { ChartControlPanel } from "#/app/components/controls";
import { ClientPageOpenedClock, ClientSnapshotClock } from "#/app/components/footer";
import { PageHeader } from "#/app/components/header";
import { KpiGrid } from "#/app/components/kpi";
import { MetricsPanel } from "#/app/components/metrics";
import { CommandPalette } from "#/app/components/palette";
import { FindPanel } from "#/app/components/finder";
import { SnapshotSection } from "#/app/components/snapshot";
import { useBenchPayload } from "#/app/hooks/use-payload";
import { useHashSync } from "#/app/hooks/use-hash";
import { useViewState } from "#/app/hooks/use-view";
import { PALETTE, type PaletteEntry } from "#/app/lib/colors";
import { searchNorm } from "#/app/lib/format";
import { buildHash } from "#/app/lib/hash";
import { buildMetrics, buildSnapshotRow } from "#/app/lib/metrics";
import type {
  EmbeddedLibraryMeta,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/types";

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
            <div className="text-center">
              <p className="text-sm text-red-400">Failed to load bench data.</p>
              <p className="mt-1 text-xs text-zinc-500">{loadError}</p>
              <p className="mt-3 text-xs text-zinc-600">
                Run <code className="text-indigo-400">pnpm bench</code> first to generate data.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="border-t-bh-blue mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-600/80 motion-reduce:animate-none" />
              <p className="text-sm text-zinc-400">Loading bench data…</p>
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

      <main
        className="mx-auto max-w-7xl px-3 pt-6 pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] sm:px-6 sm:pt-10 sm:pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))]"
        id="app"
      >
        <PageHeader title={payload.title} onCopyLink={copyViewLink} />

        {/* Bench results dir diagnostic */}
        {payload.benchResultsWarning !== undefined && payload.benchResultsWarning.length > 0 && (
          <div
            className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/9 px-4 py-3 text-sm text-amber-100/95 shadow-sm shadow-amber-950/20 backdrop-blur-md backdrop-saturate-150"
            role="alert"
          >
            <strong className="font-semibold text-amber-200">Bench results directory.</strong>{" "}
            {payload.benchResultsWarning}
          </div>
        )}

        {/* Multi-env banner */}
        {showMultiEnvBanner && (
          <div
            className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/9 px-4 py-3 text-sm text-amber-100/95 shadow-sm shadow-amber-950/20 backdrop-blur-md backdrop-saturate-150"
            role="status"
          >
            <strong className="font-semibold text-amber-200">
              Multiple environments in history.
            </strong>{" "}
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
        <ChartControlPanel
          envKey={view.envKey}
          isReloading={isReloading}
          onEnvChange={(v) => patchView({ envKey: v })}
          onReload={() => void loadData(true)}
          onRunWindowChange={(v) => patchView({ runWindow: v })}
          onScenarioChange={(v) => patchView({ scenarioId: v })}
          onScenarioNext={() => {
            if (scenarioIndex < visibleScenarios.length - 1) {
              patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
            }
          }}
          onScenarioPrev={() => {
            if (scenarioIndex > 0) {
              patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
            }
          }}
          runWindow={view.runWindow}
          runs={payload.runs}
          scenarioId={view.scenarioId}
          scenarioIndex={scenarioIndex}
          uniqueEnvKeys={uniqueEnvKeys}
          visibleScenarios={visibleScenarios}
        />

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
        <KpiGrid
          latestRun={latestRun}
          runCount={payload.runs.length}
          scenarioCount={payload.scenarios.length}
        />

        {/* Snapshot table */}
        <SnapshotSection
          compareLibs={compareLibs}
          latestRun={latestRun}
          orderedLibraries={orderedLibraries}
          paletteMap={paletteMap}
          runCount={payload.runs.length}
          snapshotRows={snapshotRows}
        />

        {/* Footer */}
        <p className="mt-10 border-t border-white/6 pt-6 text-[0.8125rem] leading-relaxed text-zinc-500">
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
