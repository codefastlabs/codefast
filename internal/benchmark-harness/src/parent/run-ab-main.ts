/**
 * The shared paired-A/B driver every suite's `bench:ab` entry calls with its own subject.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ExperimentPass, SideRun } from "#/parent/ab-report";
import { buildAbReportLines, extractSubjectHz } from "#/parent/ab-report";
import type { AbRequest } from "#/parent/ab-request";
import { parseAbRequest } from "#/parent/ab-request";
import { resolveBenchParentExitCode } from "#/parent/resolve-bench-parent-exit-code";
import { OBSERVATIONS_FILE_NAME } from "#/shared/env-keys";

// A source tree's tar can exceed the child-process default, so give the archive room.
const GIT_ARCHIVE_MAX_BUFFER = 256 * 1024 * 1024;

/**
 * What a suite's `bench:ab` entry hands the driver: the subject it swaps and where its run lives.
 *
 * @remarks The driver is subject-agnostic — it imports nothing of the library it measures. `run.ts`
 * for each suite already rebuilds the subject's `dist` from `src` before every pass, so swapping the
 * `src` on disk is the whole mechanism.
 */
export interface RunBenchAbOptions {
  /** The benchmark suite package's root, where `bench-results/` lives and `bench:isolate` runs. */
  readonly packageRootDirectory: string;
  /** The subject's package name, passed to `bench:isolate` as the library filter. */
  readonly subjectLibraryName: string;
  /** The subject package's `src`, relative to the repo root, e.g. `packages/di/src`. */
  readonly subjectSourcePath: string;
}

/** Drives the paired, alternating A/B for one subject, reporting failures through its own exit code. */
export function runBenchAbMain(argv: ReadonlyArray<string>, options: RunBenchAbOptions): void {
  const repoRootDirectory = join(options.packageRootDirectory, "..", "..");
  const subjectSourceDirectory = join(repoRootDirectory, options.subjectSourcePath);
  const benchResultsDirectory = join(options.packageRootDirectory, "bench-results");

  function materializeSourceFromRef(ref: string, label: string, workDirectory: string): string {
    const destination = join(workDirectory, label);
    mkdirSync(destination, { recursive: true });
    const archive = spawnSync("git", ["-C", repoRootDirectory, "archive", ref, options.subjectSourcePath], {
      maxBuffer: GIT_ARCHIVE_MAX_BUFFER,
    });
    if (archive.status !== 0) {
      throw new Error(`git archive ${ref} failed — is it a valid ref? ${String(archive.stderr)}`);
    }
    const extract = spawnSync("tar", ["-x", "-C", destination], { input: archive.stdout });
    if (extract.status !== 0) {
      throw new Error(`tar extract for ${ref} failed`);
    }
    return join(destination, options.subjectSourcePath);
  }

  function listRunDirectories(): ReadonlySet<string> {
    try {
      return new Set(
        readdirSync(benchResultsDirectory, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name),
      );
    } catch {
      return new Set();
    }
  }

  function measureSide(sideSourceDirectory: string, label: string, request: AbRequest): SideRun {
    rmSync(subjectSourceDirectory, { recursive: true, force: true });
    cpSync(sideSourceDirectory, subjectSourceDirectory, { recursive: true });
    const before = listRunDirectories();
    console.log(`\n▸ measuring ${label} (mode=${request.mode}, isolate)`);
    const run = spawnSync("pnpm", ["bench:isolate"], {
      cwd: options.packageRootDirectory,
      stdio: "inherit",
      env: {
        ...process.env,
        BENCH_MODE: request.mode,
        BENCH_ONLY: [...request.ids].join(","),
        BENCH_LIBRARY: options.subjectLibraryName,
      },
    });
    if (run.status !== 0) {
      throw new Error(`bench run for ${label} exited ${String(run.status)}`);
    }
    const added = [...listRunDirectories()].filter((name) => !before.has(name));
    const runId = added[0];
    if (added.length !== 1 || runId === undefined) {
      throw new Error(`expected exactly one new run directory, saw ${String(added.length)}`);
    }
    const content = readFileSync(join(benchResultsDirectory, runId, OBSERVATIONS_FILE_NAME), "utf8");
    return { runId, hzById: extractSubjectHz(content, options.subjectLibraryName, request.ids) };
  }

  try {
    const request = parseAbRequest(argv);
    const workDirectory = mkdtempSync(join(tmpdir(), "bench-ab-"));

    let newSideSource: string;
    if (request.newRef === undefined) {
      // The working tree verbatim, so an uncommitted new side is measured and restored intact.
      newSideSource = join(workDirectory, "new-src");
      cpSync(subjectSourceDirectory, newSideSource, { recursive: true });
    } else {
      newSideSource = materializeSourceFromRef(request.newRef, "new", workDirectory);
    }
    const baseSideSource = materializeSourceFromRef(request.baseRef, "base", workDirectory);

    let restored = false;
    const restore = (): void => {
      if (restored) {
        return;
      }
      restored = true;
      rmSync(subjectSourceDirectory, { recursive: true, force: true });
      cpSync(newSideSource, subjectSourceDirectory, { recursive: true });
      console.log(`\nRestored ${options.subjectSourcePath} to the new side.`);
    };
    // A synchronous spawn hands control back before the loop's finally on a signal, so restore here too.
    process.on("SIGINT", restore);
    process.on("SIGTERM", restore);

    const passes: Array<ExperimentPass> = [];
    try {
      for (let experiment = 0; experiment < request.experiments; experiment++) {
        const baseFirst = experiment % 2 === 0;
        const baseLabel = `base (${request.baseRef})`;
        const newLabel = `new (${request.newRef ?? "working tree"})`;
        console.log(
          `\n── experiment ${String(experiment + 1)}/${String(request.experiments)} — ${baseFirst ? "base → new" : "new → base"} ──`,
        );
        const firstRun = baseFirst
          ? measureSide(baseSideSource, baseLabel, request)
          : measureSide(newSideSource, newLabel, request);
        const secondRun = baseFirst
          ? measureSide(newSideSource, newLabel, request)
          : measureSide(baseSideSource, baseLabel, request);
        passes.push({
          experiment: experiment + 1,
          order: baseFirst ? "base→new" : "new→base",
          baseRun: baseFirst ? firstRun : secondRun,
          newRun: baseFirst ? secondRun : firstRun,
        });
      }
    } finally {
      restore();
      rmSync(workDirectory, { recursive: true, force: true });
    }

    for (const line of buildAbReportLines(passes, request, options.subjectLibraryName)) {
      console.log(line);
    }
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : String(caught);
    console.error(`\nA/B run failed: ${message}`);
    process.exitCode = resolveBenchParentExitCode(caught);
  }
}
