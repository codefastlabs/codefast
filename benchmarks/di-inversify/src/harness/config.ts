import type { BenchSubprocessConfig } from "@codefast/benchmark-harness";

/** Single source of truth for all benchmark-specific constants across run, serve, and subprocesses. */

export const CODEFAST_DI = {
  libraryName: "@codefast/di",
  scenarioName: "codefast",
  tsconfigFileName: "tsconfig.codefast.json",
  benchEntryFileName: "codefast-benches.ts",
} as const satisfies BenchSubprocessConfig;

export const INVERSIFY = {
  libraryName: "inversify",
  scenarioName: "inversify",
  tsconfigFileName: "tsconfig.inversify.json",
  benchEntryFileName: "inversify-benches.ts",
  displayName: "InversifyJS 8",
} as const satisfies BenchSubprocessConfig;

export const SERVE_TITLE = "@codefast/di vs inversify — bench history";
