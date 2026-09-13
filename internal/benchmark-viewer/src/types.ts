import type { ParsedRun } from "@internal/benchmark-harness/report/jsonl";

/**
 * A run's report derived on demand: the markdown and the comparison document as JSON text.
 *
 * @since 0.9.0
 */
export interface DerivedRunReport {
  readonly markdown: string;
  readonly comparisonJson: string;
}

/**
 * Configuration for the dynamic bench history server.
 *
 * @since 0.3.16-canary.0
 */
export interface BenchLibraryConfig {
  /** Must match the `libraryName` field written to JSONL by the child process. */
  readonly name: string;
  /** Label shown in UI. Defaults to `name`. */
  readonly displayName?: string;
  /** Marks this library as the reference for ratio calculations (primary ÷ compare). */
  readonly isPrimary?: boolean;
}

/**
 * Facet data a suite resolves from its scenario declarations: chip order plus per-scenario labels.
 *
 * @since 0.3.16-canary.3
 */
export interface ScenarioFacets {
  /** Chip labels in display order, and the values carried by the URL hash. */
  readonly labels: ReadonlyArray<string>;
  /** Facet labels per scenario id, as declared where each scenario is defined. */
  readonly byScenarioId: Readonly<Record<string, ReadonlyArray<string>>>;
}

/**
 * The display toggles a suite wants the viewer to open with; the URL hash still overrides them.
 *
 * @since 0.8.0
 */
export interface ViewDefaults {
  /** Draws every row of the selected scenario's group on one chart, one line per row and library. */
  readonly overlayGroup?: boolean;
  /** Plots throughput on a logarithmic axis, which keeps rows of very different scale readable together. */
  readonly useLogScale?: boolean;
}

/**
 * Options for the bench history server: results directory, port, title, libraries, and run cap.
 *
 * @since 0.3.16-canary.0
 */
export interface BenchServerOptions {
  /** Absolute path to the directory containing `<timestamp>/observations.jsonl` subdirs. */
  readonly benchResultsDir: string;
  /** Port to listen on. Default: 3000. */
  readonly port?: number;
  /** Page title shown in the browser. */
  readonly title?: string;
  /** Libraries to track. The one with `isPrimary: true` is used for ratio calculations. */
  readonly libraries: ReadonlyArray<BenchLibraryConfig>;
  /**
   * Maximum number of run directories to include in the initial payload.
   * Older runs beyond this cap are omitted but can be fetched on demand via
   * the "Load older runs" control. Default: 200.
   */
  readonly maxRuns?: number;
  /**
   * Feature filters shown as chips. The suite resolves these from its own scenario declarations;
   * the viewer only filters by label. Omit for no chip row.
   */
  readonly scenarioFacets?: ScenarioFacets;
  /** Display toggles the viewer opens with when the URL hash names none. */
  readonly viewDefaults?: ViewDefaults;
  /** Each scenario id mapped to its within-group baseline scenario id; drives the cost-vs-baseline metric. */
  readonly scenarioBaselines?: Record<string, string>;
  /**
   * Derives a run's report from its parsed observations, so the viewer can serve `report.md` and
   * `report.json` on demand for runs that no longer store them. Omit to disable the report routes.
   */
  readonly deriveReport?:
    | ((parsed: ParsedRun, context: { readonly runId: string }) => DerivedRunReport | undefined)
    | undefined;
}

// ---------------------------------------------------------------------------
// Payload types — serialised as JSON and consumed by the browser client.
// ---------------------------------------------------------------------------

/**
 * Identity and display metadata for one tracked library in the payload.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedLibraryMeta {
  readonly key: string;
  readonly displayName: string;
  readonly isPrimary: boolean;
}

/**
 * The version and GC-exposure flag recorded for one library in one run.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedRunLibraryVersion {
  readonly key: string;
  readonly version: string;
  readonly gcExposed: boolean;
}

/**
 * Environment and timing metadata for one saved benchmark run.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedRun {
  readonly folder: string;
  /** Stable key for same-machine + same-Node filtering. */
  readonly envKey: string;
  readonly envLabel: string;
  /** Stable key for same-configuration filtering (execution shape, profile, trial count). */
  readonly configKey: string;
  readonly configLabel: string;
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly nodeOptions: string;
  readonly timestampIso: string;
  readonly libraryVersions: ReadonlyArray<EmbeddedRunLibraryVersion>;
}

/**
 * Per-library time-series arrays aligned to `EmbeddedViewerPayload.runs`.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedLibraryRunData {
  readonly hz: ReadonlyArray<number | null>;
  readonly p25: ReadonlyArray<number | null>;
  readonly p75: ReadonlyArray<number | null>;
  readonly iqrFraction: ReadonlyArray<number | null>;
}

/**
 * A run at which the suite's definition of a scenario changed, and how.
 *
 * @since 0.8.0
 */
export interface EmbeddedScenarioChange {
  /** Index into `EmbeddedViewerPayload.runs` of the first run recorded under the new definition. */
  readonly runIndex: number;
  readonly label: string;
}

/**
 * How older runs of a scenario were rescaled so every run reports `hz/op` in the newest run's unit.
 *
 * @since 0.8.0
 */
export interface EmbeddedBatchNormalization {
  /** The `batch` the newest run recorded; every other run's throughput is expressed in this unit. */
  readonly referenceBatch: number;
  readonly rescaledRunCount: number;
}

/**
 * One scenario's per-library time series across all runs in the payload.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedScenarioSeries {
  readonly id: string;
  readonly group: string;
  readonly what: string;
  /** Labels of the declared facets this scenario's id matched, in declaration order. */
  readonly facets: ReadonlyArray<string>;
  /** The baseline scenario id this one's within-group ratio is measured against; absent when none. */
  readonly baselineId?: string;
  /** Keyed by `EmbeddedLibraryMeta.key` (= `libraryName` in JSONL). */
  readonly libraries: Readonly<Record<string, EmbeddedLibraryRunData>>;
  /** Runs where the scenario's `batch` or description changed; absent when it never did. */
  readonly changes?: ReadonlyArray<EmbeddedScenarioChange>;
  /** Present when at least one run was rescaled to the newest run's `batch`. */
  readonly batchNormalization?: EmbeddedBatchNormalization;
}

/**
 * The full JSON snapshot the browser client renders: libraries, runs, and scenario series.
 *
 * @since 0.3.16-canary.0
 */
export interface EmbeddedViewerPayload {
  readonly title: string;
  readonly primaryLibraryKey: string;
  readonly libraries: ReadonlyArray<EmbeddedLibraryMeta>;
  readonly runs: ReadonlyArray<EmbeddedRun>;
  readonly scenarios: ReadonlyArray<EmbeddedScenarioSeries>;
  /** Declared facet labels in chip order; empty when the suite declares none. */
  readonly facetLabels: ReadonlyArray<string>;
  /** Display toggles the suite asked the viewer to open with. */
  readonly viewDefaults?: ViewDefaults;
  /** ISO timestamp when this JSON snapshot was built (server clock). */
  readonly generatedAtIso: string;
  /** The maxRuns cap that was applied when building this payload. */
  readonly effectiveLimit: number;
  /** True when older run directories exist beyond the effectiveLimit window. */
  readonly hasMore: boolean;
  /** True when the server can derive `report.md`/`report.json` on demand for a run. */
  readonly reportsAvailable: boolean;
  /**
   * When the bench results directory could not be read, a short diagnostic for the UI.
   * Omitted when the directory was read successfully (even if it contained no runs).
   */
  readonly benchResultsWarning?: string;
}
