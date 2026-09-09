import type { BenchSubprocessConfig } from "@codefast/benchmark-harness/shared/config";

/**
 * Single source of truth for all benchmark-specific constants across run, serve, and subprocesses.
 *
 * @since 0.3.16-canary.0
 */

export const CODEFAST_DI = {
  libraryName: "@codefast/di",
  scenarioName: "codefast",
  tsconfigFileName: "tsconfig.codefast.json",
  benchEntryFileName: "codefast-benches.ts",
} as const satisfies BenchSubprocessConfig;

/**
 * @since 0.3.16-canary.0
 */
export const INVERSIFY = {
  libraryName: "inversify",
  scenarioName: "inversify",
  tsconfigFileName: "tsconfig.inversify.json",
  benchEntryFileName: "inversify-benches.ts",
  displayName: "InversifyJS 8",
} as const satisfies BenchSubprocessConfig;

/**
 * @since 0.5.0-canary.7
 */
export const AWILIX = {
  libraryName: "awilix",
  scenarioName: "awilix",
  tsconfigFileName: "tsconfig.awilix.json",
  benchEntryFileName: "awilix-benches.ts",
  displayName: "Awilix 13",
} as const satisfies BenchSubprocessConfig;

/**
 * @since 0.5.0-canary.7
 */
export const TSYRINGE = {
  libraryName: "tsyringe",
  scenarioName: "tsyringe",
  tsconfigFileName: "tsconfig.tsyringe.json",
  benchEntryFileName: "tsyringe-benches.ts",
  displayName: "tsyringe 4",
} as const satisfies BenchSubprocessConfig;

/**
 * Brandi: token-based, decorator-free container covering the full core subset.
 */
export const BRANDI = {
  libraryName: "brandi",
  scenarioName: "brandi",
  tsconfigFileName: "tsconfig.brandi.json",
  benchEntryFileName: "brandi-benches.ts",
  displayName: "Brandi 5",
} as const satisfies BenchSubprocessConfig;

/**
 * Ditox: functional, decorator-free container covering the full core subset.
 */
export const DITOX = {
  libraryName: "ditox",
  scenarioName: "ditox",
  tsconfigFileName: "tsconfig.ditox.json",
  benchEntryFileName: "ditox-benches.ts",
  displayName: "Ditox 3",
} as const satisfies BenchSubprocessConfig;

/**
 * iti: functional container whose bindings are memoized singletons, so it
 * measures only the singleton-friendly rows of the core subset.
 */
export const ITI = {
  libraryName: "iti",
  scenarioName: "iti",
  tsconfigFileName: "tsconfig.iti.json",
  benchEntryFileName: "iti-benches.ts",
  displayName: "iti 0.8",
} as const satisfies BenchSubprocessConfig;

/**
 * injection-js: Angular's `ReflectiveInjector` in its decorator mode, singleton
 * per injector with a non-cached transient root.
 */
export const INJECTION_JS = {
  libraryName: "injection-js",
  scenarioName: "injection-js",
  tsconfigFileName: "tsconfig.injection-js.json",
  benchEntryFileName: "injection-js-benches.ts",
  displayName: "injection-js 2",
} as const satisfies BenchSubprocessConfig;

/**
 * The bench-history viewer's window title.
 *
 * @since 0.3.16-canary.0
 */
export const SERVE_TITLE =
  "@codefast/di vs inversify / awilix / tsyringe / brandi / ditox / iti / injection-js — bench history";
