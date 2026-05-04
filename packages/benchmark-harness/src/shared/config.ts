/** Shape that every per-library subprocess config object must satisfy. */
export interface BenchSubprocessConfig {
  readonly libraryName: string;
  readonly scenarioName: string;
  readonly tsconfigFileName: string;
  readonly benchEntryFileName: string;
  /** Human-readable label for reports and UI. Falls back to `libraryName` when absent. */
  readonly displayName?: string;
}

export function resolveDisplayName(config: BenchSubprocessConfig): string {
  return config.displayName ?? config.libraryName;
}
