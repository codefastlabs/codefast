/** The bundle measurement a baseline keeps beside its observations, so the results page can be rebuilt from the repo. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { CODEFAST_DI } from "#harness/config";

/** The file a baseline run directory keeps its bundle measurement in. */
const FOOTPRINT_FILE_NAME = "footprint.json";

/** The file beside the suite that holds `@codefast/di`'s gzip ceiling. */
const BUDGET_FILE_NAME = "footprint-budget.json";

/** One bundled program's size. */
export interface Footprint {
  readonly label: string;
  readonly minifiedBytes: number;
  readonly gzippedBytes: number;
}

/** Every library's smallest program, measured by one bundler. */
export interface FootprintRecord {
  readonly bundler: string;
  readonly footprints: ReadonlyArray<Footprint>;
}

function isFootprint(value: unknown): value is Footprint {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "label") === "string" &&
    typeof Reflect.get(value, "minifiedBytes") === "number" &&
    typeof Reflect.get(value, "gzippedBytes") === "number"
  );
}

/** Writes a run's bundle measurement into its directory. */
export function writeFootprintRecord(runDirectory: string, record: FootprintRecord): void {
  writeFileSync(join(runDirectory, FOOTPRINT_FILE_NAME), `${JSON.stringify(record, null, 2)}\n`);
}

/**
 * Reads a run's bundle measurement.
 *
 * @throws Error when the file is missing or malformed.
 */
export function readFootprintRecord(runDirectory: string): FootprintRecord {
  const path = join(runDirectory, FOOTPRINT_FILE_NAME);
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  const bundler: unknown = typeof parsed === "object" && parsed !== null ? Reflect.get(parsed, "bundler") : undefined;
  const footprints: unknown =
    typeof parsed === "object" && parsed !== null ? Reflect.get(parsed, "footprints") : undefined;
  if (typeof bundler !== "string" || !Array.isArray(footprints) || !footprints.every(isFootprint)) {
    throw new Error(
      `${path} needs a "bundler" string and a "footprints" list of { label, minifiedBytes, gzippedBytes }.`,
    );
  }
  return { bundler, footprints };
}

/** Reads the checked-in gzip ceiling for `@codefast/di`'s program. */
export function readBudgetBytes(packageRootDirectory: string): number {
  const path = join(packageRootDirectory, BUDGET_FILE_NAME);
  const budget: unknown = JSON.parse(readFileSync(path, "utf8"));
  const entry: unknown =
    typeof budget === "object" && budget !== null ? Reflect.get(budget, CODEFAST_DI.libraryName) : undefined;
  const gzippedBytes: unknown =
    typeof entry === "object" && entry !== null ? Reflect.get(entry, "gzippedBytes") : undefined;
  if (typeof gzippedBytes !== "number" || !Number.isInteger(gzippedBytes) || gzippedBytes <= 0) {
    throw new Error(`${path} needs a positive integer "${CODEFAST_DI.libraryName}".gzippedBytes.`);
  }
  return gzippedBytes;
}
