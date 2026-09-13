import type { BenchScenarioTier } from "#/child/bench-scenario";
import { discoverBenchScenarioIds } from "#/parent/run-bench-subprocess";
import type { BenchSubprocessConfig } from "#/shared/config";
import { assertBenchEnvKeys } from "#/shared/env-keys";
import type { ScenarioListing } from "#/shared/protocol";

/**
 * One scenario, the libraries that implement it, and the libraries that owe it.
 *
 * @remarks A row only some libraries have is legal, and it is what a `BENCH_ONLY` filter has to
 * account for — a library implementing none of the requested ids measures nothing rather than failing.
 * `gaps` and `unsupported` split the absent libraries by whether their declared features cover the
 * row: a gap is coverage owed, an unsupported row reads `—` by construction. An engine row is owed
 * by nobody, so both lists stay empty for it.
 *
 * @since 0.6.0
 */
export interface BenchScenarioInventoryEntry {
  readonly id: string;
  readonly tier: BenchScenarioTier;
  readonly requires: ReadonlyArray<string>;
  readonly libraries: ReadonlyArray<string>;
  readonly gaps: ReadonlyArray<string>;
  readonly unsupported: ReadonlyArray<string>;
}

/**
 * How much of the suite one library covers, and where its declarations and its rows disagree.
 */
export interface BenchLibraryCoverage {
  readonly libraryName: string;
  readonly rows: number;
  /** Rows the library implements while lacking a feature they require — a declaration to fix. */
  readonly undeclared: ReadonlyArray<string>;
  readonly gaps: ReadonlyArray<string>;
  readonly unsupported: ReadonlyArray<string>;
}

/**
 * Every scenario a suite collects, in report order, with per-library coverage.
 *
 * @since 0.6.0
 */
export interface BenchScenarioInventory {
  readonly scenarioCount: number;
  readonly scenarios: ReadonlyArray<BenchScenarioInventoryEntry>;
  /** Present when every config declares its features; absent, the listing cannot tell a gap apart. */
  readonly coverage?: ReadonlyArray<BenchLibraryCoverage> | undefined;
}

function describeListing(listing: ScenarioListing): string {
  return `${listing.tier}[${[...listing.requires].sort().join(",")}]`;
}

/**
 * Builds the inventory from what each library listed, without spawning anything.
 *
 * @remarks Tier and `requires` come from the first library listing a row and every other library
 * must agree, since both sides of a head-to-head pair spread one descriptor; a disagreement is a
 * descriptor that drifted and is reported as an error rather than averaged away.
 *
 * @param configs - Subject first, so the inventory reads in report order rather than discovery order.
 * @param listingsByLibrary - Each library's `scenarioListings`, keyed by `libraryName`.
 */
export function buildScenarioInventoryFromListings(
  configs: ReadonlyArray<BenchSubprocessConfig>,
  listingsByLibrary: ReadonlyMap<string, ReadonlyArray<ScenarioListing>>,
): BenchScenarioInventory {
  const canonical = new Map<string, { listing: ScenarioListing; libraryName: string }>();
  const orderedIds: Array<string> = [];
  for (const config of configs) {
    for (const listing of listingsByLibrary.get(config.libraryName) ?? []) {
      const seen = canonical.get(listing.id);
      if (seen === undefined) {
        canonical.set(listing.id, { listing, libraryName: config.libraryName });
        orderedIds.push(listing.id);
        continue;
      }
      if (describeListing(seen.listing) !== describeListing(listing)) {
        throw new Error(
          `${listing.id} is declared ${describeListing(listing)} by ${config.libraryName} but ${describeListing(seen.listing)} by ${seen.libraryName}; both sides must spread one descriptor.`,
        );
      }
    }
  }

  const implementedBy = new Map(
    configs.map((config) => [
      config.libraryName,
      new Set((listingsByLibrary.get(config.libraryName) ?? []).map((listing) => listing.id)),
    ]),
  );
  const everyLibraryDeclares = configs.every((config) => config.features !== undefined);
  const featuresOf = new Map(configs.map((config) => [config.libraryName, new Set(config.features ?? [])]));
  const supports = (libraryName: string, requires: ReadonlyArray<string>): boolean =>
    requires.every((feature) => featuresOf.get(libraryName)?.has(feature) === true);

  const scenarios = orderedIds.map((id): BenchScenarioInventoryEntry => {
    const { listing } = canonical.get(id)!;
    const libraries = configs.filter((config) => implementedBy.get(config.libraryName)?.has(id) === true);
    const absent =
      listing.tier === "engine"
        ? []
        : configs.filter((config) => implementedBy.get(config.libraryName)?.has(id) !== true);
    return {
      id,
      tier: listing.tier,
      requires: listing.requires,
      libraries: libraries.map((config) => config.libraryName),
      gaps: everyLibraryDeclares
        ? absent.filter((config) => supports(config.libraryName, listing.requires)).map((config) => config.libraryName)
        : [],
      unsupported: everyLibraryDeclares
        ? absent.filter((config) => !supports(config.libraryName, listing.requires)).map((config) => config.libraryName)
        : [],
    };
  });

  const coverage = everyLibraryDeclares
    ? configs.map((config): BenchLibraryCoverage => ({
        libraryName: config.libraryName,
        rows: scenarios.filter((entry) => entry.libraries.includes(config.libraryName)).length,
        undeclared: scenarios
          .filter(
            (entry) => entry.libraries.includes(config.libraryName) && !supports(config.libraryName, entry.requires),
          )
          .map((entry) => entry.id),
        gaps: scenarios.filter((entry) => entry.gaps.includes(config.libraryName)).map((entry) => entry.id),
        unsupported: scenarios
          .filter((entry) => entry.unsupported.includes(config.libraryName))
          .map((entry) => entry.id),
      }))
    : undefined;

  return { scenarioCount: orderedIds.length, scenarios, coverage };
}

/**
 * Discovers each library's scenario listings and builds the inventory, first config's order first.
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
  const listingsByLibrary = new Map<string, ReadonlyArray<ScenarioListing>>();
  for (const config of configs) {
    const { scenarioListings } = await discoverBenchScenarioIds({
      packageRootDirectory,
      tsconfigFileName: config.tsconfigFileName,
      benchEntryFileNameUnderSrc: config.benchEntryFileName,
      harnessLabel: config.libraryName,
      scenarioName: config.scenarioName,
      forwardChildStdoutVerbose: false,
    });
    listingsByLibrary.set(config.libraryName, scenarioListings);
  }
  return buildScenarioInventoryFromListings(configs, listingsByLibrary);
}

/**
 * Renders the per-library coverage as one line each, for a person reading the console.
 */
export function formatCoverageLines(inventory: BenchScenarioInventory): Array<string> {
  if (inventory.coverage === undefined) {
    return [];
  }
  const width = Math.max(...inventory.coverage.map((entry) => entry.libraryName.length));
  return inventory.coverage.map((entry) => {
    const undeclared =
      entry.undeclared.length === 0
        ? ""
        : ` · ${String(entry.undeclared.length)} undeclared: ${entry.undeclared.join(", ")}`;
    return `${entry.libraryName.padEnd(width)}  ${String(entry.rows).padStart(3)} rows · ${String(entry.gaps.length).padStart(3)} gaps · ${String(entry.unsupported.length).padStart(3)} unsupported${undeclared}`;
  });
}

/**
 * Entry point for a suite's `bench:list` script: writes the inventory as JSON on stdout.
 *
 * @remarks Discovery progress and the coverage summary go to stderr, so stdout is the JSON document
 * alone and needs no framing markers or last-line heuristic to read back. A library implementing a
 * row while not declaring a feature it requires fails the listing: the matrix is only worth reading
 * while the declarations are true.
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
  const coverageLines = formatCoverageLines(inventory);
  if (coverageLines.length > 0) {
    console.error(
      `\nCoverage (${String(inventory.scenarioCount)} scenarios; a gap is a row the library's features allow but nobody wrote):`,
    );
    for (const line of coverageLines) {
      console.error(`  ${line}`);
    }
  }
  const undeclared = (inventory.coverage ?? []).filter((entry) => entry.undeclared.length > 0);
  if (undeclared.length > 0) {
    throw new Error(
      `${undeclared.map((entry) => entry.libraryName).join(", ")} implement rows whose required features they do not declare; fix the features list or the row's requires.`,
    );
  }
}
