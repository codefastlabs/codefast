#!/usr/bin/env node
/**
 * Parent harness: rebuild `@codefast/tailwind-variants`, run each library bench in its own subprocess in
 * `BENCH_LIBRARIES` order, then emit one report with `@codefast/tailwind-variants` as the pivot.
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
import type { RunBenchSubprocessParameters } from "@internal/benchmark-harness/parent/run-bench-subprocess";
import {
  INTERLEAVED_RUN_ORDER,
  isIsolatedBenchRunRequested,
  LIBRARY_MAJOR_RUN_ORDER,
  runBenchSubprocess,
  runBenchSubprocessesInterleaved,
} from "@internal/benchmark-harness/parent/run-bench-subprocess";
import { renderComparisonConsoleReport } from "@internal/benchmark-harness/report/comparison";
import type { BenchSubprocessConfig } from "@internal/benchmark-harness/shared/config";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";
import {
  assertBenchEnvKeys,
  BENCH_VERBOSE_ENV_KEY,
  isEnvFlagEnabled,
} from "@internal/benchmark-harness/shared/env-keys";
import type { SubprocessPayload } from "@internal/benchmark-harness/shared/protocol";

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

/**
 * Runs every library's bench and returns the payloads keyed by library name.
 *
 * @remarks Isolated runs interleave, because a ratio is only as good as the gap between the two
 * measurements it divides; one process per library has nothing to interleave, so that profile keeps its caveat.
 */
async function runEveryLibrary(
  configs: ReadonlyArray<BenchSubprocessConfig>,
): Promise<{ payloads: Map<string, SubprocessPayload>; runOrder: string }> {
  const parametersFor = (config: BenchSubprocessConfig): RunBenchSubprocessParameters => ({
    packageRootDirectory,
    tsconfigFileName: config.tsconfigFileName,
    benchEntryFileNameUnderSrc: config.benchEntryFileName,
    harnessLabel: resolveDisplayName(config),
    scenarioName: config.scenarioName,
    forwardChildStdoutVerbose: VERBOSE_MODE_ENABLED,
  });

  if (isIsolatedBenchRunRequested()) {
    return {
      payloads: await runBenchSubprocessesInterleaved(
        configs.map((config) => ({ key: config.libraryName, parameters: parametersFor(config) })),
      ),
      runOrder: INTERLEAVED_RUN_ORDER,
    };
  }
  const payloads = new Map<string, SubprocessPayload>();
  for (const config of configs) {
    payloads.set(config.libraryName, await runBenchSubprocess(parametersFor(config)));
  }
  return { payloads, runOrder: LIBRARY_MAJOR_RUN_ORDER };
}

async function main(): Promise<void> {
  assertBenchEnvKeys();
  console.log("\n@benchmark/tailwind-variants — head-to-head bench, each library paying for a render its own way.");
  const labelWidth = Math.max(...BENCH_LIBRARIES.map((library) => resolveDisplayName(library).length));
  for (const library of BENCH_LIBRARIES) {
    console.log(`  ${resolveDisplayName(library).padEnd(labelWidth)} : ${library.strategy}`);
  }
  console.log("Each library runs N trials; the table reports per-trial medians and IQR.\n");
  if (!VERBOSE_MODE_ENABLED) {
    const prefixes = BENCH_LIBRARIES.map((library) => `\`[${library.scenarioName}]\``).join(" / ");
    console.log(
      `[bench] Quiet mode: child stdout is suppressed; per-scenario progress streams on stderr (prefixed ${prefixes}). Use \`${BENCH_VERBOSE_ENV_KEY}=true\` (or \`pnpm bench:verbose\`) for full child stdout.\n`,
    );
  }

  rebuildCodefastTailwindVariantsPackage();

  const { payloads, runOrder } = await runEveryLibrary(BENCH_LIBRARIES);
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

  renderComparisonConsoleReport(codefastLibrary, competitors, TAILWIND_VARIANTS_COMPARISON_CONSOLE);

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
