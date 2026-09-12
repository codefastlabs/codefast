#!/usr/bin/env node
/**
 * Parent harness: rebuild `@codefast/di`, run every library through the shared progress display, then
 * render the comparison and persist the run's observations.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertSubjectMeasuredSomething } from "@internal/benchmark-harness/parent/assert-subject-measured";
import {
  buildBenchRunOutputPaths,
  writeBenchRunArtifacts,
} from "@internal/benchmark-harness/parent/bench-run-artifacts";
import { resolveBenchParentExitCode } from "@internal/benchmark-harness/parent/resolve-bench-parent-exit-code";
import { runBenchLibraries } from "@internal/benchmark-harness/parent/run-bench-libraries";
import { renderComparisonConsoleReport } from "@internal/benchmark-harness/report/comparison";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";
import {
  assertBenchEnvKeys,
  BENCH_VERBOSE_ENV_KEY,
  isEnvFlagEnabled,
} from "@internal/benchmark-harness/shared/env-keys";

import { assembleDiComparison } from "#/harness/comparison";
import type { LibraryPayload } from "#/harness/comparison";
import { BENCH_LIBRARIES, CODEFAST_DI } from "#/harness/config";
import { DI_COMPARISON_CONSOLE } from "#/harness/presentation";

const VERBOSE_MODE_ENABLED = isEnvFlagEnabled(BENCH_VERBOSE_ENV_KEY);

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function rebuildCodefastDiPackage(): void {
  console.log(`Rebuilding ${CODEFAST_DI.libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_DI.libraryName, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(`Build failed for ${CODEFAST_DI.libraryName}, exit ${String(result.status)}`);
  }
  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(`Finished rebuild of ${CODEFAST_DI.libraryName} (${elapsedSeconds.toFixed(1)}s wall).`);
}

async function main(): Promise<void> {
  assertBenchEnvKeys();
  console.log("\n@benchmark/di — head-to-head bench, each library in its canonical runtime mode.");
  const labelWidth = Math.max(...BENCH_LIBRARIES.map((library) => resolveDisplayName(library).length));
  for (const library of BENCH_LIBRARIES) {
    console.log(`  ${resolveDisplayName(library).padEnd(labelWidth)} : ${library.runtime}`);
  }
  console.log(
    VERBOSE_MODE_ENABLED
      ? "Verbose: every child line streams here, and the per-scenario table prints after the run.\n"
      : `Progress per library follows. \`${BENCH_VERBOSE_ENV_KEY}=true\` (\`pnpm bench:verbose\`) streams every child line and prints the per-scenario table.\n`,
  );

  rebuildCodefastDiPackage();

  const { payloads, runOrder } = await runBenchLibraries({
    packageRootDirectory,
    libraries: BENCH_LIBRARIES,
    verbose: VERBOSE_MODE_ENABLED,
  });
  const codefastPayload = payloads.get(CODEFAST_DI.libraryName)!;
  console.log(`\n[bench] Run order: ${runOrder}`);

  assertSubjectMeasuredSomething(CODEFAST_DI.libraryName, codefastPayload.trials);

  const payloadsByLibrary = new Map<string, LibraryPayload>(
    BENCH_LIBRARIES.flatMap((config) => {
      const payload = payloads.get(config.libraryName);
      return payload === undefined
        ? []
        : [
            [
              config.libraryName,
              { fingerprint: payload.fingerprint, trials: payload.trials, sanityFailures: payload.sanityFailures },
            ] as const,
          ];
    }),
  );

  const outputPaths = buildBenchRunOutputPaths(packageRootDirectory);
  const { codefastLibrary, competitors, comparisonDocument } = assembleDiComparison(payloadsByLibrary, {
    runId: outputPaths.runId,
    runOrder,
    scenariosAvailable: codefastPayload.scenarioIds?.length,
  });

  renderComparisonConsoleReport(codefastLibrary, competitors, {
    ...DI_COMPARISON_CONSOLE,
    includeScenarioTable: VERBOSE_MODE_ENABLED,
  });

  const librariesForJsonl = [...payloadsByLibrary.values()].map(({ fingerprint, trials }) => ({ fingerprint, trials }));

  writeBenchRunArtifacts({ paths: outputPaths, comparisonDocument, librariesForJsonl });
}

main().catch((caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  console.error(`\nBenchmark run failed: ${message}`);
  if (caught instanceof Error && caught.stack !== undefined) {
    console.error(caught.stack);
  }
  process.exitCode = resolveBenchParentExitCode(caught);
});
