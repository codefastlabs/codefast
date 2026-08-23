/**
 * Shape that every per-library subprocess config object must satisfy.
 *
 * @since 0.3.16-canary.0
 */
export interface BenchSubprocessConfig {
  readonly libraryName: string;
  readonly scenarioName: string;
  readonly tsconfigFileName: string;
  readonly benchEntryFileName: string;
  /** Human-readable label for reports and UI. Falls back to `libraryName` when absent. */
  readonly displayName?: string;
}

/**
 * Resolves the label reports show for a library, preferring `displayName` over `libraryName`.
 *
 * @since 0.3.16-canary.0
 */
export function resolveDisplayName(config: BenchSubprocessConfig): string {
  return config.displayName ?? config.libraryName;
}
