/** The two roles a committed bench run can hold, and the rules each one must satisfy. */
import type { BenchRunFinding } from "#audit/domain/types";

/** One directory under a suite's `baselines/` or `runs/` tree, named by its run id. */
export type BenchRunEntry = {
  readonly id: string;
  readonly relativePath: string;
  readonly childNames: ReadonlyArray<string>;
};

/**
 * One benchmark suite together with what its `baselines/`/`runs/` trees hold and what its
 * `bench:baseline` script pins.
 */
export type BenchRunSuite = {
  readonly relativePath: string;
  readonly hasBaselinesDirectory: boolean;
  readonly baselineEntries: ReadonlyArray<BenchRunEntry>;
  readonly runEntries: ReadonlyArray<BenchRunEntry>;
  readonly pinnedBaselineId: string | null;
};

/**
 * Everything the committed-bench-runs rule needs, gathered once so the rule itself stays pure.
 */
export type BenchRunAuditModel = {
  readonly suites: ReadonlyArray<BenchRunSuite>;
  readonly trackedObservationsPaths: ReadonlyArray<string>;
  readonly citedPaths: ReadonlySet<string>;
};

const BENCH_BASELINE_TOKEN = /BENCH_BASELINE=baselines\/(\S+)/;

const OBSERVATIONS_FILE_NAME = "observations.jsonl";

/**
 * Extracts the run id a `bench:baseline` script pins through its `BENCH_BASELINE=baselines/<run-id>` token.
 */
export function parsePinnedBaselineId(benchBaselineScript: string | undefined): string | null {
  if (benchBaselineScript === undefined) {
    return null;
  }
  return BENCH_BASELINE_TOKEN.exec(benchBaselineScript)?.[1] ?? null;
}

/**
 * Checks every suite's committed bench runs against the four rules a `baselines/`/`runs/` split must hold.
 *
 * @remarks A `runs/` entry counts as cited when {@link BenchRunAuditModel.citedPaths} holds its own
 * path or any path nested under it, so a link into a file inside the run directory still counts.
 */
export function auditBenchRuns(model: BenchRunAuditModel): Array<BenchRunFinding> {
  const findings: Array<BenchRunFinding> = [];

  for (const suite of model.suites) {
    findings.push(...auditBaselineDirectory(suite));
    findings.push(...auditEntryShape(suite.baselineEntries));
    findings.push(...auditEntryShape(suite.runEntries));
    findings.push(...auditRunCitations(suite, model.citedPaths));
  }

  findings.push(...auditStrayObservations(model));

  return findings;
}

// Rule 1: baselines/ holds exactly one directory, and it is the one bench:baseline pins.
function auditBaselineDirectory(suite: BenchRunSuite): Array<BenchRunFinding> {
  if (!suite.hasBaselinesDirectory) {
    return [];
  }

  const baselinesPath = `${suite.relativePath}/baselines`;

  if (suite.pinnedBaselineId === null) {
    return [
      {
        relativePath: baselinesPath,
        reason: "holds a run but bench:baseline does not pin one — add the pin or delete baselines/",
      },
    ];
  }

  const findings: Array<BenchRunFinding> = [];
  let pinnedDirectoryExists = false;

  for (const entry of suite.baselineEntries) {
    if (entry.id === suite.pinnedBaselineId) {
      pinnedDirectoryExists = true;
      continue;
    }
    findings.push({
      relativePath: entry.relativePath,
      reason: `not the pinned baseline run (bench:baseline pins ${suite.pinnedBaselineId}) — delete it or update the pin`,
    });
  }

  if (!pinnedDirectoryExists) {
    findings.push({
      relativePath: baselinesPath,
      reason: `bench:baseline pins ${suite.pinnedBaselineId}, but baselines/${suite.pinnedBaselineId}/ does not exist`,
    });
  }

  return findings;
}

// Rule 3: a baselines/<id>/ or runs/<id>/ directory holds exactly one file, observations.jsonl.
function auditEntryShape(entries: ReadonlyArray<BenchRunEntry>): Array<BenchRunFinding> {
  const findings: Array<BenchRunFinding> = [];

  for (const entry of entries) {
    if (entry.childNames.length === 1 && entry.childNames[0] === OBSERVATIONS_FILE_NAME) {
      continue;
    }
    const found = entry.childNames.length > 0 ? entry.childNames.join(", ") : "nothing";
    findings.push({
      relativePath: entry.relativePath,
      reason: `must hold exactly one file named ${OBSERVATIONS_FILE_NAME} (found: ${found})`,
    });
  }

  return findings;
}

// Rule 2: every runs/<id>/ directory is the target of at least one real markdown link.
function auditRunCitations(suite: BenchRunSuite, citedPaths: ReadonlySet<string>): Array<BenchRunFinding> {
  const findings: Array<BenchRunFinding> = [];

  for (const entry of suite.runEntries) {
    if (isCited(entry.relativePath, citedPaths)) {
      continue;
    }
    findings.push({
      relativePath: entry.relativePath,
      reason: "not cited by a link from any tracked markdown document — cite it or delete it",
    });
  }

  return findings;
}

function isCited(runPath: string, citedPaths: ReadonlySet<string>): boolean {
  for (const target of citedPaths) {
    if (target === runPath || target.startsWith(`${runPath}/`)) {
      return true;
    }
  }
  return false;
}

// Rule 4: no tracked observations.jsonl exists outside a recognized baselines/<id>/ or runs/<id>/.
function auditStrayObservations(model: BenchRunAuditModel): Array<BenchRunFinding> {
  const recognizedPaths = new Set<string>();

  for (const suite of model.suites) {
    for (const entry of [...suite.baselineEntries, ...suite.runEntries]) {
      recognizedPaths.add(`${entry.relativePath}/${OBSERVATIONS_FILE_NAME}`);
    }
  }

  return model.trackedObservationsPaths
    .filter((trackedPath) => !recognizedPaths.has(trackedPath))
    .map((trackedPath) => ({
      relativePath: trackedPath,
      reason: "tracked observations.jsonl outside any baselines/<run-id>/ or runs/<run-id>/ directory",
    }));
}
