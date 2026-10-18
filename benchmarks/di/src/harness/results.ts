#!/usr/bin/env node
/** Generates RESULTS.md and results.json from the run under `baselines/`, or with `--check` fails when either differs. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRunObservations, resolveRunDirectory } from "@internal/benchmark-harness/parent/bench-run-artifacts";
import { runOrderForShape } from "@internal/benchmark-harness/parent/run-bench-subprocess";
import { parseRunObservations } from "@internal/benchmark-harness/report/jsonl";
import { format } from "oxfmt";

import { assembleDiComparison } from "#harness/comparison";
import { readBudgetBytes, readFootprintRecord } from "#harness/footprint-record";
import { buildResultsFacts } from "#harness/results/facts";
import { BUNDLE_NOTE, LOSS_NOTES, USER_FACING_NOTES } from "#harness/results/notes";
import { LOSSES_HEADING, renderResultsPage } from "#harness/results/page";
import { validateResultsNotes } from "#harness/results/validate";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PASS_NOTES_FILE_NAME = "notes.md";

/** Formats a generated file with the repo's settings, so `pnpm format` leaves it alone. */
async function formatted(fileName: string, source: string): Promise<string> {
  const result = await format(fileName, source, { printWidth: 120, proseWrap: "always" });
  if (result.errors.length > 0) {
    throw new Error(`oxfmt could not format ${fileName}: ${result.errors.map((error) => error.message).join("; ")}`);
  }
  return result.code;
}

async function main(): Promise<void> {
  const { runId, runDirectory } = resolveRunDirectory(packageRootDirectory, "baselines");
  const { libraries, shape } = parseRunObservations(readRunObservations(runDirectory));
  if (shape === undefined) {
    throw new Error(`No valid observations in ${runDirectory}.`);
  }
  const { comparisonDocument: document } = assembleDiComparison(libraries, {
    runId,
    runOrder: runOrderForShape(shape.isolated),
    shape,
  });
  const notes = { userFacingNotes: USER_FACING_NOTES, bundleNote: BUNDLE_NOTE, lossNotes: LOSS_NOTES };
  const problems = validateResultsNotes(document, notes);
  const passNotesPath = join(runDirectory, PASS_NOTES_FILE_NAME);
  if (!existsSync(passNotesPath)) {
    problems.push(`${passNotesPath} is missing: write what this pass measured and what moved since the last one.`);
  }
  if (problems.length > 0) {
    console.error(`RESULTS.md cannot be built from ${runId}:`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  const page = renderResultsPage({
    runId,
    document,
    footprint: readFootprintRecord(runDirectory),
    budgetBytes: readBudgetBytes(packageRootDirectory),
    passNotes: readFileSync(passNotesPath, "utf8"),
    ...notes,
  });
  const files = new Map([
    ["RESULTS.md", await formatted("RESULTS.md", page)],
    ["results.json", await formatted("results.json", JSON.stringify(buildResultsFacts(document, LOSSES_HEADING)))],
  ]);

  if (process.argv.includes("--check")) {
    const stale = [...files].filter(([fileName, code]) => {
      const path = join(packageRootDirectory, fileName);
      return (existsSync(path) ? readFileSync(path, "utf8") : "") !== code;
    });
    if (stale.length > 0) {
      const names = stale.map(([fileName]) => fileName).join(" and ");
      console.error(
        `${names} ${stale.length === 1 ? "is" : "are"} not what ${runId} and the notes generate. Run \`pnpm bench:results\` and commit.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`RESULTS.md and results.json match ${runId}.`);
    return;
  }
  for (const [fileName, code] of files) {
    writeFileSync(join(packageRootDirectory, fileName), code);
  }
  console.log(`Wrote RESULTS.md and results.json from ${runId}.`);
}

await main();
