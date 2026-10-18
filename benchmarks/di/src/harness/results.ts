#!/usr/bin/env node
/** Generates RESULTS.md from the one run under `baselines/`, or with `--check` fails when the committed page differs. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRunObservations, resolveRunDirectory } from "@internal/benchmark-harness/parent/bench-run-artifacts";
import { runOrderForShape } from "@internal/benchmark-harness/parent/run-bench-subprocess";
import { parseRunObservations } from "@internal/benchmark-harness/report/jsonl";
import { format } from "oxfmt";

import { assembleDiComparison } from "#harness/comparison";
import { readBudgetBytes, readFootprintRecord } from "#harness/footprint-record";
import { BUNDLE_NOTE, LOSS_NOTES, USER_FACING_NOTES } from "#harness/results/notes";
import { renderResultsPage } from "#harness/results/page";
import { validateResultsNotes } from "#harness/results/validate";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESULTS_PATH = join(packageRootDirectory, "RESULTS.md");
const PASS_NOTES_FILE_NAME = "notes.md";

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
  // Formatted with the repo's markdown settings, so `pnpm format` leaves the generated page alone.
  const formatted = await format("RESULTS.md", page, { printWidth: 120, proseWrap: "always" });
  if (formatted.errors.length > 0) {
    throw new Error(`oxfmt could not format the page: ${formatted.errors.map((error) => error.message).join("; ")}`);
  }

  if (process.argv.includes("--check")) {
    const committed = existsSync(RESULTS_PATH) ? readFileSync(RESULTS_PATH, "utf8") : "";
    if (committed !== formatted.code) {
      console.error(
        `RESULTS.md is not what ${runId} and the notes generate. Run \`pnpm bench:results\` and commit it.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`RESULTS.md matches ${runId}.`);
    return;
  }
  writeFileSync(RESULTS_PATH, formatted.code);
  console.log(`Wrote RESULTS.md from ${runId}.`);
}

await main();
