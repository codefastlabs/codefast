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
  /** Keyed by `EmbeddedLibraryMeta.key` (= `libraryName` in JSONL). */
  readonly libraries: Readonly<Record<string, EmbeddedLibraryRunData>>;
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
  /** ISO timestamp when this JSON snapshot was built (server clock). */
  readonly generatedAtIso: string;
  /** The maxRuns cap that was applied when building this payload. */
  readonly effectiveLimit: number;
  /** True when older run directories exist beyond the effectiveLimit window. */
  readonly hasMore: boolean;
  /**
   * When the bench results directory could not be read, a short diagnostic for the UI.
   * Omitted when the directory was read successfully (even if it contained no runs).
   */
  readonly benchResultsWarning?: string;
}
