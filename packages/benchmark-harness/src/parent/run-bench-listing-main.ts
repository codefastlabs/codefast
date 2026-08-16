import { discoverBenchScenarioIds } from "#/parent/run-bench-subprocess";
import type { BenchSubprocessConfig } from "#/shared/config";
import { assertBenchEnvKeys } from "#/shared/env-keys";

/**
 * One scenario and the libraries that implement it.
 *
 * @remarks A row only some libraries have is legal, and it is what a `BENCH_ONLY` filter has to
 * account for — a library implementing none of the requested ids measures nothing rather than failing.
 *
 * @since 0.6.0
 */
export interface BenchScenarioInventoryEntry {
  readonly id: string;
  readonly libraries: ReadonlyArray<string>;
}

/**
 * Every scenario a suite collects, in report order.
 *
 * @since 0.6.0
 */
export interface BenchScenarioInventory {
  readonly scenarioCount: number;
  readonly scenarios: ReadonlyArray<BenchScenarioInventoryEntry>;
}

/**
 * Discovers each library's scenario ids and unions them, first config's order first.
 *
 * @param packageRootDirectory - The suite package the listing subprocesses spawn in.
 * @param configs - Subject first, so the inventory reads in report order rather than discovery order.
 *
 * @since 0.6.0
 */
export async function buildBenchScenarioInventory(
  packageRootDirectory: string,
  configs: ReadonlyArray<BenchSubprocessConfig>,
): Promise<BenchScenarioInventory> {
  const idsByLibrary = new Map<string, ReadonlyArray<string>>();
  for (const config of configs) {
    const { scenarioIds } = await discoverBenchScenarioIds({
      packageRootDirectory,
      tsconfigFileName: config.tsconfigFileName,
      benchEntryFileNameUnderSrc: config.benchEntryFileName,
      harnessLabel: config.libraryName,
      scenarioName: config.scenarioName,
      forwardChildStdoutVerbose: false,
    });
    idsByLibrary.set(config.libraryName, scenarioIds);
  }

  const orderedIds: Array<string> = [];
  const seen = new Set<string>();
  for (const config of configs) {
    for (const id of idsByLibrary.get(config.libraryName) ?? []) {
      if (!seen.has(id)) {
        seen.add(id);
        orderedIds.push(id);
      }
    }
  }

  return {
    scenarioCount: orderedIds.length,
    scenarios: orderedIds.map((id) => ({
      id,
      libraries: configs
        .filter((config) => (idsByLibrary.get(config.libraryName) ?? []).includes(id))
        .map((config) => config.libraryName),
    })),
  };
}

/**
 * Entry point for a suite's `bench:list` script: writes the inventory as JSON on stdout.
 *
 * @remarks Discovery progress goes to stderr, so stdout is the JSON document alone and needs no
 * framing markers or last-line heuristic to read back.
 *
 * @since 0.6.0
 */
export async function runBenchScenarioListingMain(
  packageRootDirectory: string,
  configs: ReadonlyArray<BenchSubprocessConfig>,
): Promise<void> {
  assertBenchEnvKeys();
  const inventory = await buildBenchScenarioInventory(packageRootDirectory, configs);
  process.stdout.write(`${JSON.stringify(inventory, undefined, 2)}\n`);
}
