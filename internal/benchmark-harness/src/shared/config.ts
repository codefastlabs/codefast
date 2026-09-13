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
  /**
   * Features the library's public API offers, in the suite's vocabulary; a scenario's `requires`
   * is read against it to tell a row the library owes from one it cannot express.
   */
  readonly features?: ReadonlyArray<string> | undefined;
}

/**
 * Resolves the label reports show for a library, preferring `displayName` over `libraryName`.
 *
 * @since 0.3.16-canary.0
 */
export function resolveDisplayName(config: BenchSubprocessConfig): string {
  return config.displayName ?? config.libraryName;
}
