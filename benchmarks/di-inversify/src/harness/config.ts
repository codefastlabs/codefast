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

export const AWILIX = {
  libraryName: "awilix",
  scenarioName: "awilix",
  tsconfigFileName: "tsconfig.awilix.json",
  benchEntryFileName: "awilix-benches.ts",
  displayName: "Awilix 13",
} as const satisfies BenchSubprocessConfig;

export const TSYRINGE = {
  libraryName: "tsyringe",
  scenarioName: "tsyringe",
  tsconfigFileName: "tsconfig.tsyringe.json",
  benchEntryFileName: "tsyringe-benches.ts",
  displayName: "tsyringe 4",
} as const satisfies BenchSubprocessConfig;

/**
 * @since 0.3.16-canary.0
 */
export const SERVE_TITLE = "@codefast/di vs inversify / awilix / tsyringe — bench history";
