import type { RefObject } from "react";
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
import { PALETTE_ACTIONS, useCommandPalette } from "#/app/hooks/use-command-palette";
import { useDetailsPersist } from "#/app/hooks/use-details-persist";
import { useDerivedPayload } from "#/app/hooks/use-derived-payload";
import { useBenchPayload } from "#/app/hooks/use-payload";
import { useHashSync } from "#/app/hooks/use-hash";
import { useToast } from "#/app/hooks/use-toast";
import { useViewState } from "#/app/hooks/use-view";
import { buildHash } from "#/app/lib/hash";
import type { EmbeddedViewerPayload } from "#/types";

/**
 * @since 0.3.16-canary.1
 */
export function App({ initialPayload }: { initialPayload?: EmbeddedViewerPayload }) {
  const { view, patchView } = useViewState(initialPayload);
  const { toastMsg, showToast } = useToast();

  const { payload, loadError, isReloading, loadData } = useBenchPayload({
    initialPayload,
    onReloadError: showToast,
  });

  useHashSync({ payload, view, patchView });
  useDetailsPersist(payload);

  const {
    orderedLibraries,
    paletteMap,
    visibleScenarios,
    baseRunIndices,
    runIndices,
    currentScenario,
    uniqueEnvKeys,
    uniqueGroups,
    compareLibs,
    scenarioIndex,
    showMultiEnvBanner,
    metricsData,
    snapshotRows,
    latestRun,
  } = useDerivedPayload({ payload, view, patchView });

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

  const palette = useCommandPalette({
    visibleScenarios,
    scenarioIndex,
    view,
    patchView,
    loadData,
    onCopyLink: copyViewLink,
  });

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

        {payload.benchResultsWarning !== undefined && payload.benchResultsWarning.length > 0 && (
          <div
            className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/9 px-4 py-3 text-sm text-amber-100/95 shadow-sm shadow-amber-950/20 backdrop-blur-md backdrop-saturate-150"
            role="alert"
          >
            <strong className="font-semibold text-amber-200">Bench results directory.</strong>{" "}
            {payload.benchResultsWarning}
          </div>
        )}

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

        <FindPanel
          group={view.group}
          onGroupChange={(v) => patchView({ group: v })}
          onSearchChange={(v) => patchView({ search: v })}
          search={view.search}
          uniqueGroups={uniqueGroups}
        />

        <ChartControlPanel
          envKey={view.envKey}
          isReloading={isReloading}
          onEnvChange={(v) => patchView({ envKey: v })}
          onReload={() => loadData(true)}
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

        <MetricsPanel
          currentScenario={currentScenario}
          metricsData={metricsData}
          runIndices={runIndices}
        />

        <KpiGrid
          latestRun={latestRun}
          runCount={payload.runs.length}
          scenarioCount={payload.scenarios.length}
        />

        <SnapshotSection
          compareLibs={compareLibs}
          latestRun={latestRun}
          orderedLibraries={orderedLibraries}
          paletteMap={paletteMap}
          runCount={payload.runs.length}
          snapshotRows={snapshotRows}
        />

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

      <CommandPalette
        actions={PALETTE_ACTIONS}
        inputRef={palette.inputRef}
        isOpen={palette.isOpen}
        onAction={palette.handleCommand}
        onClose={palette.close}
        onQueryChange={palette.setQuery}
        query={palette.query}
      />

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
