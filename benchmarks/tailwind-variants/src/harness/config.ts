import type { BenchSubprocessConfig } from "@codefast/benchmark-harness";

/** Single source of truth for all benchmark-specific constants across run, serve, and subprocesses. */

const TSCONFIG_FILE_NAME = "tsconfig.json";

export const CODEFAST_TV = {
  libraryName: "@codefast/tailwind-variants",
  scenarioName: "codefast",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "codefast-benches.ts",
  displayName: "@codefast/tv",
} as const satisfies BenchSubprocessConfig;

export const TAILWIND_VARIANTS = {
  libraryName: "tailwind-variants",
  scenarioName: "tailwind-variants",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "tailwind-variants-benches.ts",
} as const satisfies BenchSubprocessConfig;

export const CVA = {
  libraryName: "class-variance-authority",
  scenarioName: "cva",
  tsconfigFileName: TSCONFIG_FILE_NAME,
  benchEntryFileName: "class-variance-authority-benches.ts",
  displayName: "cva",
} as const satisfies BenchSubprocessConfig;

export const SERVE_TITLE = "@codefast/tailwind-variants vs tailwind-variants & cva — bench history";
