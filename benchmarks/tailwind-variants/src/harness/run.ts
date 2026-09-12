#!/usr/bin/env node
/**
 * Parent harness: rebuild `@codefast/tailwind-variants`, run every library through the shared progress
 * display, then render the comparison and persist the run's observations.
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

import { assembleTvComparison } from "#/harness/comparison";
import type { LibraryPayload } from "#/harness/comparison";
import { BENCH_LIBRARIES, CODEFAST_TV } from "#/harness/config";
import { TAILWIND_VARIANTS_COMPARISON_CONSOLE } from "#/harness/presentation";

const VERBOSE_MODE_ENABLED = isEnvFlagEnabled(BENCH_VERBOSE_ENV_KEY);

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function rebuildCodefastTailwindVariantsPackage(): void {
  console.log(`Rebuilding ${CODEFAST_TV.libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_TV.libraryName, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.error !== undefined) {
    throw new Error(`Build failed for ${CODEFAST_TV.libraryName}: pnpm could not be run (${result.error.message})`, {
      cause: result.error,
    });
  }
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    const outcome = result.signal === null ? `exit ${String(result.status)}` : `signal ${result.signal}`;
    throw new Error(`Build failed for ${CODEFAST_TV.libraryName}, ${outcome}`);
  }
  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(`Finished rebuild of ${CODEFAST_TV.libraryName} (${elapsedSeconds.toFixed(1)}s wall).`);
}

async function main(): Promise<void> {
  assertBenchEnvKeys();
  console.log("\n@benchmark/tailwind-variants — head-to-head bench, each library paying for a render its own way.");
  const labelWidth = Math.max(...BENCH_LIBRARIES.map((library) => resolveDisplayName(library).length));
  for (const library of BENCH_LIBRARIES) {
    console.log(`  ${resolveDisplayName(library).padEnd(labelWidth)} : ${library.strategy}`);
  }
  console.log(
    VERBOSE_MODE_ENABLED
      ? "Verbose: every child line streams here, and the per-scenario table prints after the run.\n"
      : `Progress per library follows. \`${BENCH_VERBOSE_ENV_KEY}=true\` (\`pnpm bench:verbose\`) streams every child line and prints the per-scenario table.\n`,
  );

  rebuildCodefastTailwindVariantsPackage();

  const { payloads, runOrder } = await runBenchLibraries({
    packageRootDirectory,
    libraries: BENCH_LIBRARIES,
    verbose: VERBOSE_MODE_ENABLED,
  });
  const codefastPayload = payloads.get(CODEFAST_TV.libraryName)!;
  console.log(`\n[bench] Run order: ${runOrder}`);

  assertSubjectMeasuredSomething(CODEFAST_TV.libraryName, codefastPayload.trials);

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
  const { codefastLibrary, competitors, comparisonDocument } = assembleTvComparison(payloadsByLibrary, {
    runId: outputPaths.runId,
    runOrder,
    scenariosAvailable: codefastPayload.scenarioIds?.length,
  });

  renderComparisonConsoleReport(codefastLibrary, competitors, {
    ...TAILWIND_VARIANTS_COMPARISON_CONSOLE,
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
