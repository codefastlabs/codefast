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
}

// ---------------------------------------------------------------------------
// Payload types — serialised as JSON and consumed by the browser client.
// ---------------------------------------------------------------------------

/**
 * @since 0.3.16-canary.0
 */
export interface EmbeddedLibraryMeta {
  readonly key: string;
  readonly displayName: string;
  readonly isPrimary: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
export interface EmbeddedRunLibraryVersion {
  readonly key: string;
  readonly version: string;
  readonly gcExposed: boolean;
}

/**
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
 * @since 0.3.16-canary.0
 */
export interface EmbeddedScenarioSeries {
  readonly id: string;
  readonly group: string;
  readonly what: string;
  /** Keyed by `EmbeddedLibraryMeta.key` (= `libraryName` in JSONL). */
  readonly libraries: Readonly<Record<string, EmbeddedLibraryRunData>>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface EmbeddedViewerPayload {
  readonly title: string;
  readonly primaryLibraryKey: string;
  readonly libraries: ReadonlyArray<EmbeddedLibraryMeta>;
  readonly runs: ReadonlyArray<EmbeddedRun>;
  readonly scenarios: ReadonlyArray<EmbeddedScenarioSeries>;
  /** ISO timestamp when this JSON snapshot was built (server clock). */
  readonly generatedAtIso: string;
  /**
   * When the bench results directory could not be read, a short diagnostic for the UI.
   * Omitted when the directory was read successfully (even if it contained no runs).
   */
  readonly benchResultsWarning?: string;
}
