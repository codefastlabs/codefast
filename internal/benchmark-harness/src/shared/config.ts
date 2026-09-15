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
 * The libraries a run keeps under a library filter, in their configured order.
 *
 * @remarks An entry matches a library's `libraryName` or `displayName`, case-insensitively. An entry
 * matching nothing is a typo, and the error names every library the suite knows.
 *
 * @since 0.9.0
 */
export function selectLibraries<Config extends BenchSubprocessConfig>(
  libraries: ReadonlyArray<Config>,
  filter: ReadonlySet<string> | undefined,
): ReadonlyArray<Config> {
  if (filter === undefined) {
    return libraries;
  }
  const wanted = new Set([...filter].map((entry) => entry.toLowerCase()));
  const matches = (config: Config): boolean =>
    wanted.has(config.libraryName.toLowerCase()) || wanted.has(resolveDisplayName(config).toLowerCase());
  const unknown = [...wanted].filter(
    (entry) =>
      !libraries.some(
        (config) => config.libraryName.toLowerCase() === entry || resolveDisplayName(config).toLowerCase() === entry,
      ),
  );
  if (unknown.length > 0) {
    const known = libraries.map((config) => `${config.libraryName} (${resolveDisplayName(config)})`).join(", ");
    throw new Error(`No library is named ${unknown.map((entry) => `"${entry}"`).join(", ")}. Known: ${known}.`);
  }
  return libraries.filter(matches);
}

/**
 * Resolves the label reports show for a library, preferring `displayName` over `libraryName`.
 *
 * @since 0.3.16-canary.0
 */
export function resolveDisplayName(config: BenchSubprocessConfig): string {
  return config.displayName ?? config.libraryName;
}
