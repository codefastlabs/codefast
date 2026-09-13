import type { BenchSubprocessConfig } from "@internal/benchmark-harness/shared/config";

/**
 * One benched library: how the parent spawns it, heads its column, and describes its render path.
 *
 * @since 0.8.0
 */
export interface TvBenchLibrary extends BenchSubprocessConfig {
  /** Abbreviation heading the library's ratio column in the comparison table. */
  readonly shortName: string;
  /** What one render costs the library — where it caches and where it merges — printed beside its name. */
  readonly strategy: string;
}

/** Single source of truth for all benchmark-specific constants across run, serve, and subprocesses. */

const TSCONFIG_FILE_NAME = "tsconfig.json";

/**
 * @since 0.3.16-canary.0
 */
export const CODEFAST_TV = {
  libraryName: "@codefast/tailwind-variants",
  scenarioName: "codefast",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "codefast-benches.ts",
  displayName: "@codefast/tv",
  shortName: "cf",
  strategy:
    "resolution cached per selection, tailwind-merge behind its own cache; both switchable, and the `uncached-*` control rows switch both off",
} as const satisfies TvBenchLibrary;

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS = {
  libraryName: "tailwind-variants",
  scenarioName: "tailwind-variants",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "tailwind-variants-benches.ts",
  shortName: "tv",
  strategy: "resolution cached per selection with no switch to turn it off, tailwind-merge inside `tv()`",
} as const satisfies TvBenchLibrary;

/**
 * @since 0.3.16-canary.0
 */
export const CVA = {
  libraryName: "class-variance-authority",
  scenarioName: "cva",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "class-variance-authority-benches.ts",
  displayName: "cva",
  shortName: "cva",
  strategy: "no result cache; the with-merge rows call `tailwind-merge` after `cva()`, the usual production pairing",
} as const satisfies TvBenchLibrary;

/**
 * Every competitor in comparison-column order; the subject is never in this list.
 *
 * @since 0.8.0
 */
export const COMPETITORS: ReadonlyArray<TvBenchLibrary> = [TAILWIND_VARIANTS, CVA];

/**
 * Every benched library, subject first, in spawn order.
 *
 * @since 0.8.0
 */
export const BENCH_LIBRARIES: ReadonlyArray<TvBenchLibrary> = [CODEFAST_TV, ...COMPETITORS];

/**
 * The versus line naming the subject and every competitor, shared by the report heading and the viewer title.
 *
 * @since 0.8.0
 */
export const VERSUS_LINE = `${CODEFAST_TV.libraryName} vs ${COMPETITORS.map((library) => library.libraryName).join(" / ")}`;

/**
 * @since 0.3.16-canary.0
 */
export const SERVE_TITLE = `${VERSUS_LINE} — bench history`;
