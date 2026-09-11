#!/usr/bin/env node
/** Derives `report.md` and `report.json` from a run's `observations.jsonl`, for the RESULTS.md workflow. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRunObservations, resolveRunDirectory } from "@internal/benchmark-harness/parent/bench-run-artifacts";
import { runOrderForShape } from "@internal/benchmark-harness/parent/run-bench-subprocess";
import { parseRunObservations } from "@internal/benchmark-harness/report/jsonl";
import { writeJsonFile, writeMarkdownFile } from "@internal/benchmark-harness/report/write";

import { assembleDiComparison } from "#/harness/comparison";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function main(): void {
  const requested = process.argv[2];
  const { runId, runDirectory } = resolveRunDirectory(packageRootDirectory, requested);
  const { libraries, shape } = parseRunObservations(readRunObservations(runDirectory));
  if (shape === undefined) {
    throw new Error(`No valid observations in ${runDirectory}.`);
  }
  const { markdown, comparisonDocument } = assembleDiComparison(libraries, {
    runId,
    runOrder: runOrderForShape(shape.isolated),
    shape,
  });
  const markdownPath = join(runDirectory, "report.md");
  const jsonPath = join(runDirectory, "report.json");
  writeMarkdownFile(markdownPath, markdown);
  writeJsonFile(jsonPath, comparisonDocument);
  console.log(`Derived report for run ${runId}:`);
  console.log(`  ${markdownPath}`);
  console.log(`  ${jsonPath}`);
}

main();
