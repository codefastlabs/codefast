/** The `bench:results` entry every suite shares: RESULTS.md and results.json from the run under `baselines/`. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { format } from "oxfmt";

import { readRunObservations, resolveRunDirectory } from "#parent/bench-run-artifacts";
import { runOrderForShape } from "#parent/run-bench-subprocess";
import { parseRunObservations } from "#report/jsonl";
import { buildResultsFacts } from "#results/facts";
import { readBudgetBytes, readFootprintRecord } from "#results/footprint-record";
import { LOSSES_HEADING, renderResultsPage } from "#results/page";
import type { ResultsSuite } from "#results/suite";
import { validateResultsNotes } from "#results/validate";

const PASS_NOTES_FILE_NAME = "notes.md";

/** Formats a generated file with the repo's settings, so `pnpm format` leaves it alone. */
async function formatted(fileName: string, source: string): Promise<string> {
  const result = await format(fileName, source, { printWidth: 120, proseWrap: "always" });
  if (result.errors.length > 0) {
    throw new Error(`oxfmt could not format ${fileName}: ${result.errors.map((error) => error.message).join("; ")}`);
  }
  return result.code;
}

/**
 * Builds a suite's RESULTS.md and results.json from its baseline and writes them, or with `--check` sets a failing
 * exit code when either committed file differs.
 *
 * @remarks Refuses to build, with every reason listed, while a note fails validation or the pass has no `notes.md`.
 */
export async function runResultsMain(
  suite: ResultsSuite,
  packageRootDirectory: string,
  argv: ReadonlyArray<string> = process.argv,
): Promise<void> {
  const { runId, runDirectory } = resolveRunDirectory(packageRootDirectory, "baselines");
  const { libraries, shape } = parseRunObservations(readRunObservations(runDirectory));
  if (shape === undefined) {
    throw new Error(`No valid observations in ${runDirectory}.`);
  }
  const document = suite.assemble(libraries, { runId, runOrder: runOrderForShape(shape.isolated), shape });
  const problems = validateResultsNotes(suite, document);
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
    suite,
    runId,
    document,
    footprint: readFootprintRecord(runDirectory),
    budgetBytes: readBudgetBytes(packageRootDirectory, suite.subject.libraryName),
    passNotes: readFileSync(passNotesPath, "utf8"),
  });
  const files = new Map([
    ["RESULTS.md", await formatted("RESULTS.md", page)],
    ["results.json", await formatted("results.json", JSON.stringify(buildResultsFacts(document, LOSSES_HEADING)))],
  ]);

  if (argv.includes("--check")) {
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
