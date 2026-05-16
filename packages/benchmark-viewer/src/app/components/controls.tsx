import type { ViewState } from "#/app/lib/hash";
import type { EmbeddedRun, EmbeddedScenarioSeries } from "#/types";

interface ChartControlPanelProps {
  isReloading: boolean;
  onReload: () => void;
  scenarioId: string;
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  onScenarioChange: (id: string) => void;
  scenarioIndex: number;
  onScenarioPrev: () => void;
  onScenarioNext: () => void;
  envKey: string;
  uniqueEnvKeys: Array<string>;
  runs: ReadonlyArray<EmbeddedRun>;
  onEnvChange: (key: string) => void;
  runWindow: ViewState["runWindow"];
  onRunWindowChange: (window: ViewState["runWindow"]) => void;
}

export function ChartControlPanel({
  isReloading,
  onReload,
  scenarioId,
  visibleScenarios,
  onScenarioChange,
  scenarioIndex,
  onScenarioPrev,
  onScenarioNext,
  envKey,
  uniqueEnvKeys,
  runs,
  onEnvChange,
  runWindow,
  onRunWindowChange,
}: ChartControlPanelProps) {
  return (
    <div
      aria-label="Chart data selection"
      className="bh-glass--sticky sticky top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 mt-6 mb-5 flex flex-col gap-3 px-3 py-3 max-sm:gap-2 max-sm:py-2.5 sm:top-3 sm:-mx-2 sm:mt-8 sm:mb-6 sm:gap-4 sm:px-5 sm:py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2 sm:gap-y-1">
        <p className="bh-section-title mb-0">Chart data</p>
        <button
          aria-busy={isReloading}
          aria-label="Reload benchmark data from server"
          className="bh-btn-reload shrink-0"
          disabled={isReloading}
          onClick={onReload}
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
      <div className="flex flex-col gap-4 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:rounded-xl max-sm:bg-black/22 max-sm:p-2 max-sm:[box-shadow:inset_0_0.0625rem_0_rgba(255,255,255,0.05),0_0_0_0.0625rem_rgba(255,255,255,0.06)] sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        <div className="flex w-full min-w-0 flex-col gap-2 max-sm:col-span-full max-sm:mb-0.5 max-sm:gap-1.5 max-sm:border-b max-sm:border-white/6 max-sm:pb-2 sm:w-auto sm:max-w-none sm:flex-[1_1_20rem] sm:flex-row sm:flex-wrap sm:items-end">
          <label className="w-full min-w-0 flex-1 sm:w-auto sm:max-w-md sm:min-w-56">
            <span className="bh-field-label max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
              Scenario
            </span>
            <select
              aria-label="Benchmark scenario"
              className="bh-focus bh-field bh-field--chart-select max-sm:h-9 max-sm:min-h-9"
              onChange={(e) => onScenarioChange(e.target.value)}
              value={scenarioId}
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
            className="bh-chart-toolbar bh-chart-toolbar--match-field w-full shrink-0 max-sm:min-h-10 sm:w-auto"
            role="group"
          >
            <button
              aria-label="Previous scenario"
              className="bh-seg-btn max-sm:min-h-10"
              disabled={scenarioIndex <= 0}
              onClick={onScenarioPrev}
              title="Previous scenario in filtered list"
              type="button"
            >
              ← Prev
            </button>
            <button
              aria-label="Next scenario"
              className="bh-seg-btn max-sm:min-h-10"
              disabled={scenarioIndex >= visibleScenarios.length - 1}
              onClick={onScenarioNext}
              title="Next scenario in filtered list"
              type="button"
            >
              Next →
            </button>
          </div>
        </div>
        <label className="w-full min-w-0 sm:w-auto sm:max-w-[22rem] sm:min-w-[min(100%,16.25rem)] sm:flex-[1.1]">
          <span className="bh-field-label max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
            Environment
          </span>
          <select
            aria-label="Filter runs by CPU and Node"
            className="bh-focus bh-field bh-field--chart-select max-sm:h-9 max-sm:min-h-9"
            onChange={(e) => onEnvChange(e.target.value)}
            value={envKey}
          >
            <option value="">All runs</option>
            {uniqueEnvKeys.map((key) => {
              const sample = runs.find((r) => r.envKey === key);
              return (
                <option key={key} value={key}>
                  {sample?.envLabel ?? key}
                </option>
              );
            })}
          </select>
        </label>
        <label className="w-full min-w-0 shrink-0 sm:w-auto sm:max-w-44 sm:min-w-[min(100%,10rem)]">
          <span className="bh-field-label max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
            Runs shown
          </span>
          <select
            aria-label="Limit chart to the most recent runs"
            className="bh-focus bh-field bh-field--chart-select max-sm:h-9 max-sm:min-h-9"
            onChange={(e) => onRunWindowChange(e.target.value as ViewState["runWindow"])}
            title="After Environment filter, only the newest N runs are plotted"
            value={runWindow}
          >
            <option value="all">All matching runs</option>
            <option value="20">Last 20 runs</option>
            <option value="10">Last 10 runs</option>
          </select>
        </label>
      </div>
    </div>
  );
}
