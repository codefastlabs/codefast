import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PinIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "#app/components/icons";
import { useCompactOnScroll } from "#app/hooks/use-compact-on-scroll";
import type { ViewState } from "#app/lib/hash";
import { cn } from "#app/lib/utils";
import type { EmbeddedScenarioSeries } from "#types";

const RUN_WINDOW_VALUES = ["all", "10", "20"] as const satisfies ReadonlyArray<ViewState["runWindow"]>;

const RUN_WINDOW_LABELS: Record<ViewState["runWindow"], string> = {
  all: "All matching",
  "10": "Last 10",
  "20": "Last 20",
};

function IconButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "border-bh-border bh-hover-ready:border-bh-border-strong bg-bh-fill-white-4 bh-hover-ready:bg-bh-fill-white-7 text-bh-label bh-hover-ready:text-bh-ink-hover bh-aria-busy:opacity-55 bh-aria-busy:cursor-wait aria-pressed:border-bh-blue-ring aria-pressed:bg-bh-blue/15 focus-visible:outline-bh-blue inline-flex size-9 shrink-0 items-center justify-center rounded-xl border [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:text-zinc-50 motion-reduce:transition-none",
        className,
      )}
    />
  );
}

function TextButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "border-bh-border bh-hover-ready:border-bh-border-strong bg-bh-fill-white-4 bh-hover-ready:bg-bh-fill-white-7 text-bh-ink bh-hover-ready:text-bh-ink-hover focus-visible:outline-bh-blue inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-medium [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
        className,
      )}
    />
  );
}

interface ChipSelectProps extends ComponentProps<"select"> {
  label: string;
  /** What the closed chip reads, since the native select under it is invisible. */
  displayValue: string;
}

/** A filter chip whose menu is the platform's own select, laid invisibly over the chip so it stays accessible. */
function ChipSelect({ label, displayValue, className, ...props }: ChipSelectProps) {
  return (
    <span
      className={cn(
        "border-bh-border bg-bh-fill-white-4 has-[select:hover]:bg-bh-fill-white-7 has-[select:focus-visible]:outline-bh-blue relative inline-flex h-8 max-w-full shrink-0 items-center gap-1.5 rounded-full border ps-3 pe-2 text-[0.75rem] text-zinc-400 has-[select:focus-visible]:outline has-[select:focus-visible]:outline-offset-2",
        className,
      )}
    >
      <span aria-hidden="true">{label}</span>
      <span aria-hidden="true" className="truncate font-medium text-zinc-100">
        {displayValue}
      </span>
      <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" />
      <select {...props} className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0" />
    </span>
  );
}

interface ScenarioPickerProps {
  scenarioId: string;
  scenarioIndex: number;
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  onScenarioChange: (id: string) => void;
  onScenarioPrev: () => void;
  onScenarioNext: () => void;
}

/** The scenario select between its previous and next steps, showing the group and the position in the list. */
function ScenarioPicker({
  scenarioId,
  scenarioIndex,
  visibleScenarios,
  onScenarioChange,
  onScenarioPrev,
  onScenarioNext,
}: ScenarioPickerProps) {
  const current = visibleScenarios[scenarioIndex];

  return (
    <div
      aria-label="Scenario"
      className="border-bh-border bg-bh-surface-toolbar flex h-9 min-w-0 items-stretch overflow-hidden rounded-xl border max-sm:w-full sm:w-[min(100%,26rem)]"
      role="group"
    >
      <button
        aria-label="Previous scenario"
        className="text-bh-label hover:text-bh-ink-hover inline-flex w-9 shrink-0 items-center justify-center hover:bg-white/6 focus-visible:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        disabled={scenarioIndex <= 0}
        onClick={onScenarioPrev}
        title="Previous scenario in filtered list"
        type="button"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <span className="border-bh-border relative flex min-w-0 flex-1 items-center gap-2 border-x px-2.5 has-[select:focus-visible]:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] has-[select:hover]:bg-white/4">
        {current !== undefined && (
          <span
            aria-hidden="true"
            className="bg-bh-blue/15 shrink-0 rounded-full px-2 py-px text-[0.6875rem] font-medium text-sky-200"
          >
            {current.group}
          </span>
        )}
        <span aria-hidden="true" className="truncate text-sm font-medium text-zinc-100">
          {current?.id ?? "No scenario matches"}
        </span>
        <span aria-hidden="true" className="ms-auto shrink-0 text-xs text-zinc-500 tabular-nums">
          {visibleScenarios.length > 0 ? `${String(scenarioIndex + 1)} / ${String(visibleScenarios.length)}` : ""}
        </span>
        <select
          aria-label="Benchmark scenario"
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
          id="ctrl-scenario"
          onChange={(e) => onScenarioChange(e.target.value)}
          value={scenarioId}
        >
          {visibleScenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              [{scenario.group}] {scenario.id}
            </option>
          ))}
        </select>
      </span>
      <button
        aria-label="Next scenario"
        className="text-bh-label hover:text-bh-ink-hover inline-flex w-9 shrink-0 items-center justify-center hover:bg-white/6 focus-visible:shadow-[inset_0_0_0_0.125rem_var(--color-bh-blue)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        disabled={scenarioIndex >= visibleScenarios.length - 1}
        onClick={onScenarioNext}
        title="Next scenario in filtered list"
        type="button"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </div>
  );
}

interface ReportMenuProps {
  runFolder: string;
}

/** The newest matching run's report, offered in both formats behind one download button. */
function ReportMenu({ runFolder }: ReportMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  // A details element stays open until its summary is clicked again, so a press outside or Escape closes it here.
  useEffect(() => {
    const close = (): void => {
      menuRef.current?.removeAttribute("open");
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target) !== true) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && menuRef.current?.open === true) {
        close();
        menuRef.current.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const link = (format: "md" | "json"): ReactNode => (
    <a
      className="block rounded-lg px-3 py-2 text-[0.8125rem] text-zinc-200 hover:bg-white/6"
      download
      href={`/api/report.${format}?run=${encodeURIComponent(runFolder)}`}
      onClick={() => menuRef.current?.removeAttribute("open")}
    >
      report.{format}
    </a>
  );

  return (
    <details className="group relative" ref={menuRef}>
      <summary
        aria-label="Download the newest matching run's report"
        className="border-bh-border bh-hover-ready:bg-bh-fill-white-7 bg-bh-fill-white-4 text-bh-label hover:text-bh-ink-hover focus-visible:outline-bh-blue group-open:bg-bh-fill-white-7 inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-xl border focus-visible:outline focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
        title="Download the report for the newest matching run"
      >
        <DownloadIcon className="size-4" />
      </summary>
      <div className="border-bh-border-strong bg-bh-surface-elevated absolute end-0 top-11 z-50 w-48 rounded-xl border p-1.5 backdrop-blur-2xl">
        <p className="px-3 pt-1 pb-1.5 text-[0.6875rem] text-zinc-500">Newest matching run</p>
        {link("md")}
        {link("json")}
      </div>
    </details>
  );
}

interface ChartControlPanelProps {
  isReloading: boolean;
  onReload: () => void;
  hasMore: boolean;
  onLoadOlderRuns: () => void;
  /** The run whose report can be downloaded, or `undefined` when none can. */
  reportRunFolder: string | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  group: string;
  uniqueGroups: Array<string>;
  onGroupChange: (value: string) => void;
  facetLabels: ReadonlyArray<string>;
  selectedFacets: Array<string>;
  onToggleFacet: (label: string) => void;
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
  configKey: string;
  uniqueConfigKeys: Array<string>;
  configLabelMap: Record<string, string>;
  onConfigChange: (key: string) => void;
  runWindow: ViewState["runWindow"];
  onRunWindowChange: (window: ViewState["runWindow"]) => void;
}

/**
 * Renders the scenario-and-data bar: one row of scenario picker, search, filter chips and actions, folding to the
 * scenario row and a summary of the filters once the page scrolls — sticky on desktop.
 *
 * @since 0.3.16-canary.3
 */
export function ChartControlPanel({
  isReloading,
  onReload,
  hasMore,
  onLoadOlderRuns,
  reportRunFolder,
  search,
  onSearchChange,
  group,
  uniqueGroups,
  onGroupChange,
  facetLabels,
  selectedFacets,
  onToggleFacet,
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
  configKey,
  uniqueConfigKeys,
  configLabelMap,
  onConfigChange,
  runWindow,
  onRunWindowChange,
}: ChartControlPanelProps) {
  // Scrolled past the chart's top, the sticky panel keeps only the scenario row unless pinned open.
  const { isCompact, pinned, togglePinned } = useCompactOnScroll();
  const foldable = cn(isCompact && "sm:hidden");
  const envLabel = envKey === "" ? "All" : (envLabelMap[envKey] ?? envKey);
  const configLabel = configKey === "" ? "All" : (configLabelMap[configKey] ?? configKey);
  const filterSummary = [
    group === "" ? undefined : `Group ${group}`,
    `${RUN_WINDOW_LABELS[runWindow]} runs`,
    envKey === "" ? undefined : envLabel,
    uniqueConfigKeys.length > 1 ? configLabel : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(" · ");

  return (
    <div
      aria-label="Scenario and data selection"
      className="border-bh-border bg-bh-surface-sticky shadow-bh-sticky z-40 mt-6 mb-5 flex flex-col gap-2.5 rounded-[1.25rem] border p-2.5 backdrop-blur-2xl backdrop-saturate-200 sm:sticky sm:top-3 sm:-mx-2 sm:mt-8 sm:mb-6 sm:px-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ScenarioPicker
          onScenarioChange={onScenarioChange}
          onScenarioNext={onScenarioNext}
          onScenarioPrev={onScenarioPrev}
          scenarioId={scenarioId}
          scenarioIndex={scenarioIndex}
          visibleScenarios={visibleScenarios}
        />
        <label
          className={cn(
            "border-bh-border has-[input:focus-visible]:border-bh-blue relative flex h-9 items-center gap-2 rounded-xl border bg-black/30 ps-2.5 text-zinc-500 max-sm:flex-1 sm:w-48",
            foldable,
          )}
          htmlFor="scenario-search"
        >
          <SearchIcon className="size-4 shrink-0" />
          <input
            aria-label="Search scenarios"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent pe-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            id="scenario-search"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search scenarios"
            type="search"
            value={search}
          />
        </label>
        <ChipSelect
          aria-label="Filter by group"
          className={foldable}
          displayValue={group === "" ? "All" : group}
          id="ctrl-group"
          label="Group"
          onChange={(e) => onGroupChange(e.target.value)}
          value={group}
        >
          <option value="">All groups</option>
          {uniqueGroups.map((groupName) => (
            <option key={groupName} value={groupName}>
              {groupName}
            </option>
          ))}
        </ChipSelect>
        <ChipSelect
          aria-label="Limit chart to the most recent runs"
          className={foldable}
          displayValue={RUN_WINDOW_LABELS[runWindow]}
          id="ctrl-run-window"
          label="Runs"
          onChange={(e) => {
            const value = e.target.value;
            if ((RUN_WINDOW_VALUES as ReadonlyArray<string>).includes(value)) {
              onRunWindowChange(value as ViewState["runWindow"]);
            }
          }}
          title="After the environment filter, only the newest N runs are plotted"
          value={runWindow}
        >
          <option value="all">All matching runs</option>
          <option value="20">Last 20 runs</option>
          <option value="10">Last 10 runs</option>
        </ChipSelect>
        <ChipSelect
          aria-label="Filter runs by CPU and Node"
          className={cn("sm:max-w-64", foldable)}
          displayValue={envLabel}
          id="ctrl-env"
          label="Env"
          onChange={(e) => onEnvChange(e.target.value)}
          value={envKey}
        >
          <option value="">All runs</option>
          {uniqueEnvKeys.map((key) => (
            <option key={key} value={key}>
              {envLabelMap[key] ?? key}
            </option>
          ))}
        </ChipSelect>
        {uniqueConfigKeys.length > 1 && (
          <ChipSelect
            aria-label="Filter runs by benchmark configuration"
            className={cn("sm:max-w-64", foldable)}
            displayValue={configLabel}
            id="ctrl-config"
            label="Config"
            onChange={(e) => onConfigChange(e.target.value)}
            value={configKey}
          >
            <option value="">All configs</option>
            {uniqueConfigKeys.map((key) => (
              <option key={key} value={key}>
                {configLabelMap[key] ?? key}
              </option>
            ))}
          </ChipSelect>
        )}
        {isCompact && <p className="m-0 truncate text-xs text-zinc-500 max-sm:hidden">{filterSummary}</p>}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {isCompact ? (
            <TextButton className="max-sm:hidden" onClick={togglePinned} title="Show every filter while scrolling">
              <SlidersHorizontalIcon className="size-3.5" />
              Filters
            </TextButton>
          ) : (
            <>
              {hasMore && (
                <TextButton
                  aria-label="Load older benchmark runs"
                  disabled={isReloading}
                  onClick={onLoadOlderRuns}
                  title="Fetch older runs from the server and add them to the chart"
                >
                  ← Older runs
                </TextButton>
              )}
              {reportRunFolder !== undefined && <ReportMenu runFolder={reportRunFolder} />}
              <IconButton
                aria-label={
                  pinned ? "Let the filters fold away while scrolling" : "Keep every filter visible while scrolling"
                }
                aria-pressed={pinned}
                className="max-sm:hidden"
                onClick={togglePinned}
                title={
                  pinned ? "Let the filters fold away while scrolling" : "Keep every filter visible while scrolling"
                }
              >
                <PinIcon className="size-4" />
              </IconButton>
              <IconButton
                aria-busy={isReloading}
                aria-label="Reload benchmark data from server"
                disabled={isReloading}
                onClick={onReload}
                title="Fetch the latest runs from the server without refreshing the page"
              >
                <RefreshCwIcon className="size-4" />
              </IconButton>
            </>
          )}
        </div>
      </div>
      {facetLabels.length > 0 && (
        <div
          aria-label="Feature filters — a scenario stays listed when it matches any selected feature"
          className={cn("flex flex-wrap items-center gap-1.5 px-1", foldable)}
          role="group"
        >
          <span className="text-bh-label-muted me-1.5 text-[0.6875rem] font-medium">Features</span>
          {facetLabels.map((label) => {
            const isSelected = selectedFacets.includes(label);
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "focus-visible:outline-bh-blue inline-flex min-h-7 items-center rounded-full border px-2.5 py-0.5 text-[0.75rem] leading-5 font-medium [transition:background_0.15s_ease,border-color_0.15s_ease,color_0.15s_ease] focus-visible:outline focus-visible:outline-offset-2 motion-reduce:transition-none",
                  isSelected
                    ? "border-bh-blue-ring bg-bh-blue/15 text-zinc-50"
                    : "border-bh-border bg-bh-fill-white-4 hover:bg-bh-fill-white-7 text-zinc-400 hover:text-zinc-200",
                )}
                key={label}
                onClick={() => onToggleFacet(label)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
