import { readdirSync, readFileSync } from "node:fs";
import type { Dirent } from "node:fs";
import { join } from "node:path";
import { OBSERVATIONS_FILE_NAME } from "#/shared/env-keys";

/**
 * @since 0.3.16-canary.0
 */
export interface RunLines {
  readonly folderName: string;
  readonly lines: ReadonlyArray<string>;
}

function readRunDirectory(runDirPath: string, folderName: string): RunLines | undefined {
  const jsonlPath = join(runDirPath, OBSERVATIONS_FILE_NAME);
  let content: string;
  try {
    content = readFileSync(jsonlPath, "utf8");
  } catch {
    return undefined;
  }
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return undefined;
  }
  return { folderName, lines };
}

/**
 * @since 0.3.16-canary.0
 */
export function listRawRuns(benchResultsDir: string): Array<RunLines> {
  let entries: Array<Dirent<string>>;
  try {
    entries = readdirSync(benchResultsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const runs: Array<RunLines> = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const run = readRunDirectory(join(benchResultsDir, entry.name), entry.name);
    if (run !== undefined) {
      runs.push(run);
    }
  }
  runs.sort((left, right) => left.folderName.localeCompare(right.folderName));
  return runs;
}
