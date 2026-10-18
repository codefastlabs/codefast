/** Measures what each library adds to a browser bundle, and holds the subject to its checked-in gzip budget. */
import { gzipSync } from "node:zlib";

import { rolldown, VERSION as ROLLDOWN_VERSION } from "rolldown";

import { resolveRunDirectory } from "#parent/bench-run-artifacts";
import type { Footprint } from "#results/footprint-record";
import { FOOTPRINT_BUDGET_FILE_NAME, readBudgetBytes, writeFootprintRecord } from "#results/footprint-record";
import type { BenchSubprocessConfig } from "#shared/config";
import { resolveDisplayName } from "#shared/config";

const ENTRY_ID = "\0footprint-entry";

/**
 * A program bundled alone, after the libraries, so a shared dependency's share reads off one line.
 *
 * @since 0.12.0
 */
export interface FootprintExtraProgram {
  /** Wrapped in backticks, which keeps the line out of the subject's size ranking. */
  readonly label: string;
  readonly source: string;
}

/**
 * Everything a suite declares to measure its bundle table and gate its subject.
 *
 * @since 0.12.0
 */
export interface FootprintSuite {
  readonly packageRootDirectory: string;
  readonly subject: BenchSubprocessConfig;
  /** Every library, subject included, in table order. */
  readonly libraries: ReadonlyArray<BenchSubprocessConfig>;
  /** Each library's smallest program, by `libraryName`, written the way its documentation sets a project up. */
  readonly programs: Readonly<Record<string, string>>;
  readonly extraPrograms?: ReadonlyArray<FootprintExtraProgram> | undefined;
  /** Builds the subject's `dist` from the working tree before anything is bundled. */
  readonly rebuild: () => unknown;
}

/**
 * Bundles one program for the browser, minified, and returns its minified and gzipped size.
 *
 * @since 0.12.0
 */
export async function measureFootprint(cwd: string, label: string, source: string): Promise<Footprint> {
  const build = await rolldown({
    input: ENTRY_ID,
    cwd,
    platform: "browser",
    logLevel: "silent",
    plugins: [
      {
        name: "footprint-entry",
        resolveId: (id) => (id === ENTRY_ID ? id : null),
        load: (id) => (id === ENTRY_ID ? source : null),
      },
    ],
  });
  try {
    const { output } = await build.generate({ format: "esm", minify: true });
    const code = output
      .filter((item) => item.type === "chunk")
      .map((chunk) => chunk.code)
      .join("");
    return { label, minifiedBytes: Buffer.byteLength(code), gzippedBytes: gzipSync(code, { level: 9 }).byteLength };
  } finally {
    await build.close();
  }
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

/** Reports the subject's gzipped size against its budget and returns whether it fits. */
function checkBudget(suite: FootprintSuite, { gzippedBytes }: Footprint): boolean {
  const { libraryName } = suite.subject;
  const budgetBytes = readBudgetBytes(suite.packageRootDirectory, libraryName);
  const headroomBytes = budgetBytes - gzippedBytes;
  const verdict = `${libraryName}: ${String(gzippedBytes)} B gzipped, budget ${String(budgetBytes)} B`;
  if (headroomBytes < 0) {
    console.error(
      `${verdict} — over by ${String(-headroomBytes)} B. Shrink the bundle, or raise the budget in ${FOOTPRINT_BUDGET_FILE_NAME} with the reason in the PR.`,
    );
    return false;
  }
  console.log(`${verdict} (${String(headroomBytes)} B headroom).`);
  return true;
}

function programFor(suite: FootprintSuite, libraryName: string): string {
  const program = suite.programs[libraryName];
  if (program === undefined) {
    throw new Error(`No footprint program for ${libraryName}: add one to the suite's programs.`);
  }
  return program;
}

/**
 * Runs a suite's `bench:footprint` entry and sets the exit code.
 *
 * @remarks `--check` bundles only the subject against its budget; `--save` records the whole table beside the run
 * under `baselines/`, so the results page rebuilds from the repo alone.
 *
 * @since 0.12.0
 */
export async function runFootprintMain(
  suite: FootprintSuite,
  argv: ReadonlyArray<string> = process.argv,
): Promise<void> {
  const { packageRootDirectory, subject } = suite;
  suite.rebuild();
  if (argv.includes("--check")) {
    const footprint = await measureFootprint(
      packageRootDirectory,
      subject.libraryName,
      programFor(suite, subject.libraryName),
    );
    process.exitCode = checkBudget(suite, footprint) ? 0 : 1;
    return;
  }
  const footprints: Array<Footprint> = [];
  let subjectFootprint: Footprint | undefined;
  for (const library of suite.libraries) {
    const footprint = await measureFootprint(
      packageRootDirectory,
      resolveDisplayName(library),
      programFor(suite, library.libraryName),
    );
    if (library.libraryName === subject.libraryName) {
      subjectFootprint = footprint;
    }
    footprints.push(footprint);
  }
  for (const extra of suite.extraPrograms ?? []) {
    footprints.push(await measureFootprint(packageRootDirectory, extra.label, extra.source));
  }
  const rows = footprints.map(
    ({ label, minifiedBytes, gzippedBytes }) =>
      `| ${label} | ${kilobytes(minifiedBytes)} | ${kilobytes(gzippedBytes)} |`,
  );
  console.log(["| Library | Minified | Gzipped |", "| --- | ---: | ---: |", ...rows].join("\n"));
  if (subjectFootprint === undefined) {
    throw new Error(`${subject.libraryName} is missing from the suite's libraries.`);
  }
  if (argv.includes("--save")) {
    const { runDirectory } = resolveRunDirectory(packageRootDirectory, "baselines");
    writeFootprintRecord(runDirectory, { bundler: `Rolldown ${ROLLDOWN_VERSION}`, footprints });
    console.log(`Saved the table to ${runDirectory}.`);
  }
  process.exitCode = checkBudget(suite, subjectFootprint) ? 0 : 1;
}
