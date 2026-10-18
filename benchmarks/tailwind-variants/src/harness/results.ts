#!/usr/bin/env node
/** Generates RESULTS.md and results.json from the run under `baselines/`, or with `--check` fails when either differs. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runResultsMain } from "@internal/benchmark-harness/results/run-results-main";
import type { ResultsSuite } from "@internal/benchmark-harness/results/suite";

import { assembleTvComparison } from "#harness/comparison";
import { CODEFAST_TV, COMPETITORS } from "#harness/config";
import type { TvCompetitorName } from "#harness/config";
import { TV_RESULTS_NOTES } from "#harness/results/notes";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const TV_RESULTS_SUITE: ResultsSuite<TvCompetitorName> = {
  directory: "benchmarks/tailwind-variants",
  benchGuide: "../di/BENCH_GUIDE.md",
  subject: CODEFAST_TV,
  competitors: COMPETITORS,
  notes: TV_RESULTS_NOTES,
  copy: {
    coverage:
      "a `—` below is a row the library cannot express — `cva` has no slots, no extends and no factory — or a control only codefast runs, never a row nobody wrote.",
    environment:
      "Each library runs through its default entry with the merge flag passed explicitly, so the two `tv()` libraries differ in implementation and not in configuration; `cva` has no merge option, so its with-merge rows call `tailwind-merge` after it, the usual production pairing.",
    userFacingIntro:
      "Most rows below price one render of a component with a selection the library has already seen, and many of them run faster than any frame could notice. Three measurements are the ones an application feels, so they lead: what defining its components costs as a module loads, what one render costs, and what the library adds to a browser bundle.",
    bundleLead: (bundler) =>
      `\`pnpm bench:footprint\` bundles each library's smallest program — one component with one variant, defined and rendered once — with ${bundler} for the browser, minified. A library that merges by default ships \`tailwind-merge\`, and the merge is measured alone on the last line.`,
    subjectOnlyRows:
      "Rows with no competitor ratio are the `uncached-*` controls: codefast with its resolution cache and tailwind-merge's cache both off, so the miss path stays measured.",
    excludedReason:
      "the controls have no competitor to compare, and the definition rows price a definition rather than a render, where an eager library pays at definition what a lazy one pays at its first render.",
    listing: "`pnpm bench:list` prints which rows each library implements.",
  },
  assemble: (libraries, options) => assembleTvComparison(libraries, options).comparisonDocument,
};

await runResultsMain(TV_RESULTS_SUITE, packageRootDirectory);
