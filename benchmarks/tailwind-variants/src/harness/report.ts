#!/usr/bin/env node
/** Derives `report.md` and `report.json` from a run's `observations.jsonl`, for the RESULTS.md workflow. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRunObservations, resolveRunDirectory } from "@codefast/benchmark-harness/parent/bench-run-artifacts";
import { runOrderForShape } from "@codefast/benchmark-harness/parent/run-bench-subprocess";
import { parseRunObservations } from "@codefast/benchmark-harness/report/jsonl";
import { writeJsonFile, writeMarkdownFile } from "@codefast/benchmark-harness/report/write";

import { assembleTvComparison } from "#/harness/comparison";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function main(): void {
  const requested = process.argv[2];
  const { runId, runDirectory } = resolveRunDirectory(packageRootDirectory, requested);
  const { libraries, shape } = parseRunObservations(readRunObservations(runDirectory));
  if (shape === undefined) {
    throw new Error(`No valid observations in ${runDirectory}.`);
  }
  const { markdown, comparisonDocument } = assembleTvComparison(libraries, {
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
