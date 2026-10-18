#!/usr/bin/env node
/** Generates RESULTS.md and results.json from the run under `baselines/`, or with `--check` fails when either differs. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runResultsMain } from "@internal/benchmark-harness/results/run-results-main";
import type { ResultsSuite } from "@internal/benchmark-harness/results/suite";

import { assembleDiComparison } from "#harness/comparison";
import { CODEFAST_DI, COMPETITORS } from "#harness/config";
import type { DiCompetitorName } from "#harness/config";
import { DI_RESULTS_NOTES } from "#harness/results/notes";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const DI_RESULTS_SUITE: ResultsSuite<DiCompetitorName> = {
  directory: "benchmarks/di",
  benchGuide: "./BENCH_GUIDE.md",
  subject: CODEFAST_DI,
  competitors: COMPETITORS,
  notes: DI_RESULTS_NOTES,
  copy: {
    coverage:
      "every library implements every row its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.",
    environment:
      "Each library runs at its canonical decorator mode (inversify legacy decorators + `reflect-metadata`, codefast standard decorators + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its fastest documented configuration.",
    userFacingIntro:
      "Most rows below price one operation in isolation, and many of them run faster than any request could notice. Three measurements are the ones an application feels, so they lead: what starting it up costs, what one request costs, and what the library adds to a browser bundle.",
    bundleLead: (bundler) =>
      `\`pnpm bench:footprint\` bundles each library's smallest bind-and-resolve program with ${bundler} for the browser, minified. A library whose setup requires \`reflect-metadata\` ships it, and the polyfill is measured alone on the last line.`,
    subjectOnlyRows: "Rows with no competitor ratio are codefast-only coverage, instrumentation for this resolver.",
    excludedReason: "their two sides do incomparable work per op.",
    listing:
      "`BENCH_TIER=contract` runs the comparison without the engine rows; `pnpm bench:list` prints which rows each library implements.",
  },
  assemble: (libraries, options) => assembleDiComparison(libraries, options).comparisonDocument,
};

await runResultsMain(DI_RESULTS_SUITE, packageRootDirectory);
