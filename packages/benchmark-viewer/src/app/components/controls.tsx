import type { ComponentProps } from "react";
import { RefreshCwIcon } from "#/app/components/icons";
import type { ViewState } from "#/app/lib/hash";
import { cn } from "#/app/lib/utils";
import type { EmbeddedScenarioSeries } from "#/types";

const RUN_WINDOW_VALUES = ["all", "10", "20"] as const satisfies ReadonlyArray<
  ViewState["runWindow"]
>;

function ReloadButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "text-bh-ink border-bh-border bg-bh-fill-white-4 shadow-bh-btn-reload bh-hover-ready:text-bh-ink-hover bh-hover-ready:border-bh-border-strong bh-hover-ready:bg-bh-fill-white-7 focus-visible:outline-bh-blue bh-aria-busy:cursor-wait bh-aria-busy:opacity-55 inline-flex items-center justify-center gap-[0.4rem] rounded-full border px-[0.95rem] py-[0.38rem] font-[inherit] text-[0.8125rem] leading-tight font-medium tracking-[-0.015em] backdrop-blur-[0.875rem] backdrop-saturate-160 [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-[0.1875rem] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
        className,
      )}
    />
  );
}

function FieldLabel({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      {...props}
      className={cn("mb-1.5 block text-[0.8125rem] font-medium text-zinc-400", className)}
    />
  );
}

function FieldSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "focus:border-bh-blue focus:ring-bh-blue/35 focus-visible:outline-bh-blue box-border h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm leading-normal text-zinc-100 shadow-(--shadow-bh-field-inset) placeholder:text-zinc-500 focus:ring-2 focus:outline-none focus-visible:outline focus-visible:outline-offset-2",
        className,
      )}
    />
  );
}

function SegButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "text-bh-seg-ink border-r-bh-border bg-bh-surface-seg hover:bg-bh-surface-seg-hover disabled:hover:bg-bh-table-seg-disabled m-0 box-border inline-flex min-h-0 items-center justify-center self-stretch rounded-none border-0 border-r px-2.5 py-[0.35rem] text-[0.8125rem] leading-5 font-medium last:border-r-0 focus:z-1 focus:outline-none focus-visible:z-1 focus-visible:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] disabled:cursor-not-allowed disabled:opacity-40 max-sm:flex-[1_1_0] max-sm:px-3",
        className,
      )}
    />
  );
}

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
  envLabelMap: Record<string, string>;
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
  envLabelMap,
  onEnvChange,
  runWindow,
  onRunWindowChange,
}: ChartControlPanelProps) {
  return (
    <div
      aria-label="Chart data selection"
      className="border-bh-border bg-bh-surface-sticky shadow-bh-sticky sticky top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 mt-6 mb-5 flex flex-col gap-3 rounded-[1.25rem] border px-3 py-3 backdrop-blur-[2.25rem] backdrop-saturate-200 max-sm:gap-2 max-sm:py-2.5 sm:top-3 sm:-mx-2 sm:mt-8 sm:mb-6 sm:gap-4 sm:px-5 sm:py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2 sm:gap-y-1">
        <p className="text-bh-label mb-0 text-[0.65rem] font-semibold tracking-[0.14em] uppercase">
          Chart data
        </p>
        <ReloadButton
          aria-busy={isReloading}
          aria-label="Reload benchmark data from server"
          className="shrink-0"
          disabled={isReloading}
          onClick={onReload}
          title="Fetch the latest runs from the server without refreshing the page"
        >
          <RefreshCwIcon className="size-3.5 shrink-0 opacity-88" />
          Reload data
        </ReloadButton>
      </div>
      <div className="flex flex-col gap-4 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:rounded-xl max-sm:bg-black/22 max-sm:p-2 max-sm:[box-shadow:inset_0_0.0625rem_0_rgba(255,255,255,0.05),0_0_0_0.0625rem_rgba(255,255,255,0.06)] sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        <div className="flex w-full min-w-0 flex-col gap-2 max-sm:col-span-full max-sm:mb-0.5 max-sm:gap-1.5 max-sm:border-b max-sm:border-white/6 max-sm:pb-2 sm:w-auto sm:max-w-none sm:flex-[1_1_20rem] sm:flex-row sm:flex-wrap sm:items-end">
          <label
            className="w-full min-w-0 flex-1 sm:w-auto sm:max-w-md sm:min-w-56"
            htmlFor="ctrl-scenario"
          >
            <FieldLabel className="max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
              Scenario
            </FieldLabel>
            <FieldSelect
              aria-label="Benchmark scenario"
              className="max-sm:h-9 max-sm:min-h-9"
              id="ctrl-scenario"
              onChange={(e) => onScenarioChange(e.target.value)}
              value={scenarioId}
            >
              {visibleScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  [{scenario.group}] {scenario.id}
                </option>
              ))}
            </FieldSelect>
          </label>
          <div
            aria-label="Previous or next scenario in the filtered list"
            className="border-bh-border bg-bh-surface-toolbar shadow-bh-toolbar box-border inline-flex h-10 w-full shrink-0 flex-wrap items-stretch overflow-hidden rounded-xl border backdrop-blur-md backdrop-saturate-150 max-sm:h-auto max-sm:min-h-11 max-sm:w-full sm:w-auto"
            role="group"
          >
            <SegButton
              aria-label="Previous scenario"
              className="max-sm:min-h-10"
              disabled={scenarioIndex <= 0}
              onClick={onScenarioPrev}
              title="Previous scenario in filtered list"
            >
              ← Prev
            </SegButton>
            <SegButton
              aria-label="Next scenario"
              className="max-sm:min-h-10"
              disabled={scenarioIndex >= visibleScenarios.length - 1}
              onClick={onScenarioNext}
              title="Next scenario in filtered list"
            >
              Next →
            </SegButton>
          </div>
        </div>
        <label
          className="w-full min-w-0 sm:w-auto sm:max-w-88 sm:min-w-[min(100%,16.25rem)] sm:flex-[1.1]"
          htmlFor="ctrl-env"
        >
          <FieldLabel className="max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
            Environment
          </FieldLabel>
          <FieldSelect
            aria-label="Filter runs by CPU and Node"
            className="max-sm:h-9 max-sm:min-h-9"
            id="ctrl-env"
            onChange={(e) => onEnvChange(e.target.value)}
            value={envKey}
          >
            <option value="">All runs</option>
            {uniqueEnvKeys.map((key) => (
              <option key={key} value={key}>
                {envLabelMap[key] ?? key}
              </option>
            ))}
          </FieldSelect>
        </label>
        <label
          className="w-full min-w-0 shrink-0 sm:w-auto sm:max-w-44 sm:min-w-[min(100%,10rem)]"
          htmlFor="ctrl-run-window"
        >
          <FieldLabel className="max-sm:mb-[0.2rem] max-sm:text-[0.6875rem] max-sm:leading-[1.2]">
            Runs shown
          </FieldLabel>
          <FieldSelect
            aria-label="Limit chart to the most recent runs"
            className="max-sm:h-9 max-sm:min-h-9"
            id="ctrl-run-window"
            onChange={(e) => {
              const value = e.target.value;
              if ((RUN_WINDOW_VALUES as ReadonlyArray<string>).includes(value)) {
                onRunWindowChange(value as ViewState["runWindow"]);
              }
            }}
            title="After Environment filter, only the newest N runs are plotted"
            value={runWindow}
          >
            <option value="all">All matching runs</option>
            <option value="20">Last 20 runs</option>
            <option value="10">Last 10 runs</option>
          </FieldSelect>
        </label>
      </div>
    </div>
  );
}
