import type { BenchSubprocessConfig } from "@internal/benchmark-harness/shared/config";

/** One benched library: how the parent spawns it, heads its column, and describes its wiring. */
export interface DiBenchLibrary extends BenchSubprocessConfig {
  /** Abbreviation heading the library's ratio column in the comparison table. */
  readonly shortName: string;
  /** How the library wires dependencies at runtime, printed beside its name in the run header. */
  readonly runtime: string;
}

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
  shortName: "cf",
  runtime: "TC39 Stage 3 decorators + Symbol.metadata",
} as const satisfies DiBenchLibrary;

/**
 * @since 0.3.16-canary.0
 */
export const INVERSIFY = {
  libraryName: "inversify",
  scenarioName: "inversify",
  tsconfigFileName: "tsconfig.inversify.json",
  benchEntryFileName: "inversify-benches.ts",
  displayName: "InversifyJS 8",
  shortName: "inv",
  runtime: "legacy experimental decorators + reflect-metadata, `{ jitless: false }` codegen resolvers",
} as const satisfies DiBenchLibrary;

/**
 * @since 0.5.0-canary.7
 */
export const AWILIX = {
  libraryName: "awilix",
  scenarioName: "awilix",
  tsconfigFileName: "tsconfig.awilix.json",
  benchEntryFileName: "awilix-benches.ts",
  displayName: "Awilix 13",
  shortName: "awi",
  runtime: "decorator-free, `asClass` / `asFunction` registrations resolved through the proxy cradle",
} as const satisfies DiBenchLibrary;

/**
 * @since 0.5.0-canary.7
 */
export const TSYRINGE = {
  libraryName: "tsyringe",
  scenarioName: "tsyringe",
  tsconfigFileName: "tsconfig.tsyringe.json",
  benchEntryFileName: "tsyringe-benches.ts",
  displayName: "tsyringe 4",
  shortName: "tsy",
  runtime: "legacy experimental decorators + reflect-metadata",
} as const satisfies DiBenchLibrary;

/**
 * Brandi: token-based, decorator-free container covering the full core subset.
 */
export const BRANDI = {
  libraryName: "brandi",
  scenarioName: "brandi",
  tsconfigFileName: "tsconfig.brandi.json",
  benchEntryFileName: "brandi-benches.ts",
  displayName: "Brandi 5",
  shortName: "brn",
  runtime: "decorator-free, tokens wired with `injected()`",
} as const satisfies DiBenchLibrary;

/**
 * Ditox: functional, decorator-free container covering the full core subset.
 */
export const DITOX = {
  libraryName: "ditox",
  scenarioName: "ditox",
  tsconfigFileName: "tsconfig.ditox.json",
  benchEntryFileName: "ditox-benches.ts",
  displayName: "Ditox 3",
  shortName: "dtx",
  runtime: "decorator-free, tokens wired with `bindFactory`",
} as const satisfies DiBenchLibrary;

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
  shortName: "inj",
  runtime: "legacy experimental decorators + reflect-metadata",
} as const satisfies DiBenchLibrary;

/** Every competitor in comparison-column order; the subject is never in this list. */
export const COMPETITORS: ReadonlyArray<DiBenchLibrary> = [INVERSIFY, AWILIX, TSYRINGE, BRANDI, DITOX, INJECTION_JS];

/** Every benched library, subject first, in spawn order. */
export const BENCH_LIBRARIES: ReadonlyArray<DiBenchLibrary> = [CODEFAST_DI, ...COMPETITORS];

/** The versus line naming the subject and every competitor, shared by the report heading and the viewer title. */
export const VERSUS_LINE = `${CODEFAST_DI.libraryName} vs ${COMPETITORS.map((library) => library.libraryName).join(" / ")}`;

/**
 * The bench-history viewer's window title.
 *
 * @since 0.3.16-canary.0
 */
export const SERVE_TITLE = `${VERSUS_LINE} — bench history`;
