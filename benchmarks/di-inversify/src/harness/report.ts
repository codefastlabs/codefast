import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/harness/protocol";

/**
 * One (library, scenario) row after collapsing the per-trial payloads.
 *
 * We report **medians**, not means, because trial-to-trial distribution is
 * heavily right-skewed: the first trial usually lands far below steady-state
 * (JIT warmup), and very occasionally one trial spikes due to GC. Median is
 * robust to both; mean is not.
 *
 * `hzPerOpIqr` is the interquartile range (P75 − P25) of per-trial `hzPerOp`
 * values, expressed as a fraction of the median. It tells the reader "how
 * stable is this number trial-to-trial"; anything above ~0.05 deserves a
 * second look before drawing conclusions.
 */
export interface AggregatedScenarioResult {
  readonly id: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly trialsIncluded: number;
  readonly hzPerOpMedian: number;
  readonly hzPerOpIqrFraction: number;
  readonly meanMsMedian: number;
  readonly p75MsMedian: number;
  readonly p99MsMedian: number;
  readonly p999MsMedian: number;
}

/**
 * One library's full slice of the comparison. Produced by aggregating every
 * `TrialPayload` into per-scenario medians.
 */
export interface LibraryReport {
  readonly fingerprint: Fingerprint;
  readonly trialCount: number;
  readonly sanityFailures: readonly string[];
  readonly scenarios: readonly AggregatedScenarioResult[];
}

function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((left, right) => left - right);
}

/**
 * Linear-interpolation quantile. `q` in [0, 1]. Matches NumPy's default
 * (`linear`) so external analysis tooling agrees with what we print.
 *
 * Returns `0` for an empty list; callers guard against that before rendering.
 */
function quantile(sortedValues: readonly number[], q: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0] ?? 0;
  }
  const position = q * (sortedValues.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sortedValues[lowerIndex] ?? 0;
  const upper = sortedValues[upperIndex] ?? 0;
  if (lowerIndex === upperIndex) {
    return lower;
  }
  const fraction = position - lowerIndex;
  return lower + (upper - lower) * fraction;
}

/**
 * Collapses N trial results for one scenario into one aggregated row.
 *
 * Trials with `samples === 0` are skipped — that's the sentinel the trial
 * runner writes when tinybench reported an error for that task. Keeping
 * failed trials in the median would drag it toward 0 and mask the rest of
 * the distribution.
 */
function aggregateTrialsForScenario(
  scenarioId: string,
  perTrialResults: readonly ScenarioTrialResult[],
): AggregatedScenarioResult | undefined {
  const successfulTrials = perTrialResults.filter((trial) => trial.samples > 0);
  if (successfulTrials.length === 0) {
    return undefined;
  }
  const firstTrial = successfulTrials[0];
  if (firstTrial === undefined) {
    return undefined;
  }
  const hzPerOpSortedAscending = sortAscending(successfulTrials.map((trial) => trial.hzPerOp));
  const meanMsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.meanMs));
  const p75MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p75Ms));
  const p99MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p99Ms));
  const p999MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p999Ms));

  const hzPerOpMedian = quantile(hzPerOpSortedAscending, 0.5);
  const hzPerOpP25 = quantile(hzPerOpSortedAscending, 0.25);
  const hzPerOpP75 = quantile(hzPerOpSortedAscending, 0.75);
  const hzPerOpIqrFraction = hzPerOpMedian > 0 ? (hzPerOpP75 - hzPerOpP25) / hzPerOpMedian : 0;

  return {
    id: scenarioId,
    group: firstTrial.group,
    stress: firstTrial.stress,
    batch: firstTrial.batch,
    what: firstTrial.what,
    trialsIncluded: successfulTrials.length,
    hzPerOpMedian,
    hzPerOpIqrFraction,
    meanMsMedian: quantile(meanMsSortedAscending, 0.5),
    p75MsMedian: quantile(p75MsSortedAscending, 0.5),
    p99MsMedian: quantile(p99MsSortedAscending, 0.5),
    p999MsMedian: quantile(p999MsSortedAscending, 0.5),
  };
}

/**
 * Turns the raw `TrialPayload[]` emitted by a subprocess into a per-library
 * `LibraryReport` the renderer can consume directly.
 */
export function buildLibraryReport(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
  sanityFailures: readonly string[],
): LibraryReport {
  const perScenarioTrials = new Map<string, ScenarioTrialResult[]>();
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      const list = perScenarioTrials.get(scenarioResult.id);
      if (list === undefined) {
        perScenarioTrials.set(scenarioResult.id, [scenarioResult]);
      } else {
        list.push(scenarioResult);
      }
    }
  }

  const aggregated: AggregatedScenarioResult[] = [];
  for (const [scenarioId, perTrialResults] of perScenarioTrials) {
    const row = aggregateTrialsForScenario(scenarioId, perTrialResults);
    if (row !== undefined) {
      aggregated.push(row);
    }
  }

  return {
    fingerprint,
    trialCount: trials.length,
    sanityFailures,
    scenarios: aggregated,
  };
}

/**
 * Formats a throughput ratio as "1.23×" when defined, "—" otherwise. Only
 * renders when both operands are positive, otherwise the ratio is
 * mathematically meaningless and hiding it is the honest move.
 */
function formatThroughputRatio(numeratorHz: number, denominatorHz: number): string {
  if (denominatorHz <= 0 || numeratorHz <= 0) {
    return "—";
  }
  return `${(numeratorHz / denominatorHz).toFixed(2)}×`;
}

function formatHz(hz: number): string {
  if (hz <= 0) {
    return "—";
  }
  return Math.round(hz).toLocaleString("en-US");
}

function formatMs(ms: number): string {
  if (ms <= 0) {
    return "—";
  }
  return ms.toFixed(4);
}

function formatIqrFraction(iqr: number): string {
  if (!Number.isFinite(iqr) || iqr <= 0) {
    return "—";
  }
  return `${(iqr * 100).toFixed(1)}%`;
}

/**
 * Orders scenarios for display: group first (stable by first appearance),
 * then within a group by `id`. This is what the reader wants when scanning
 * a table — related rows sit together.
 */
function orderedScenarioIds(
  baselineOrder: readonly string[],
  aggregatedByLibrary: ReadonlyMap<string, LibraryReport>,
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of baselineOrder) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const report of aggregatedByLibrary.values()) {
    for (const scenario of report.scenarios) {
      if (!seen.has(scenario.id)) {
        seen.add(scenario.id);
        ordered.push(scenario.id);
      }
    }
  }
  return ordered;
}

interface ComparisonTableRow {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly stress: boolean;
  readonly codefastHzPerOp: number;
  readonly codefastIqrFraction: number;
  readonly codefastMeanMs: number;
  readonly codefastP99Ms: number;
  readonly inversifyHzPerOp: number;
  readonly inversifyIqrFraction: number;
  readonly inversifyMeanMs: number;
  readonly inversifyP99Ms: number;
}

/**
 * Zips the codefast and inversify reports into a single row per scenario.
 * Scenarios present in only one library show "—" on the missing side — this
 * is the codefast-only `realistic-graph-validate` case.
 */
function buildComparisonRows(
  codefastReport: LibraryReport,
  inversifyReport: LibraryReport,
): ComparisonTableRow[] {
  const codefastByScenarioId = new Map(
    codefastReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const inversifyByScenarioId = new Map(
    inversifyReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const baselineOrder = codefastReport.scenarios.map((scenario) => scenario.id);
  const displayOrder = orderedScenarioIds(
    baselineOrder,
    new Map([
      ["codefast", codefastReport],
      ["inversify", inversifyReport],
    ]),
  );

  const rows: ComparisonTableRow[] = [];
  for (const scenarioId of displayOrder) {
    const codefast = codefastByScenarioId.get(scenarioId);
    const inversify = inversifyByScenarioId.get(scenarioId);
    const anyPresent = codefast ?? inversify;
    if (anyPresent === undefined) {
      continue;
    }
    rows.push({
      id: scenarioId,
      group: anyPresent.group,
      batch: anyPresent.batch,
      what: anyPresent.what,
      stress: anyPresent.stress,
      codefastHzPerOp: codefast?.hzPerOpMedian ?? 0,
      codefastIqrFraction: codefast?.hzPerOpIqrFraction ?? 0,
      codefastMeanMs: codefast?.meanMsMedian ?? 0,
      codefastP99Ms: codefast?.p99MsMedian ?? 0,
      inversifyHzPerOp: inversify?.hzPerOpMedian ?? 0,
      inversifyIqrFraction: inversify?.hzPerOpIqrFraction ?? 0,
      inversifyMeanMs: inversify?.meanMsMedian ?? 0,
      inversifyP99Ms: inversify?.p99MsMedian ?? 0,
    });
  }
  return rows;
}

const MARKDOWN_TABLE_HEADER = [
  "| Scenario | Group | batch | codefast hz/op | inversify hz/op | codefast / inversify | codefast mean ms | inversify mean ms | codefast p99 ms | inversify p99 ms | IQR (cf / inv) |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
].join("\n");

function renderMarkdownRow(row: ComparisonTableRow): string {
  const ratioCell = formatThroughputRatio(row.codefastHzPerOp, row.inversifyHzPerOp);
  return [
    row.id,
    row.group,
    String(row.batch),
    formatHz(row.codefastHzPerOp),
    formatHz(row.inversifyHzPerOp),
    ratioCell,
    formatMs(row.codefastMeanMs),
    formatMs(row.inversifyMeanMs),
    formatMs(row.codefastP99Ms),
    formatMs(row.inversifyP99Ms),
    `${formatIqrFraction(row.codefastIqrFraction)} / ${formatIqrFraction(row.inversifyIqrFraction)}`,
  ]
    .map((cell) => `| ${cell} `)
    .join("")
    .concat("|");
}

/**
 * Renders the full head-to-head table as GitHub-flavoured markdown.
 *
 * Stress scenarios are split into a second table below the main one so a
 * reader skimming the report doesn't mistake "child-depth-8-stress" for a
 * representative workload. The section headers call out which table is the
 * comparison-you-should-cite.
 */
export function renderMarkdownReport(
  codefastReport: LibraryReport,
  inversifyReport: LibraryReport,
): string {
  const rows = buildComparisonRows(codefastReport, inversifyReport);
  const comparableRows = rows.filter((row) => !row.stress && row.group !== "diagnostic");
  const stressRows = rows.filter((row) => row.stress);
  const diagnosticRows = rows.filter((row) => row.group === "diagnostic" && !row.stress);

  const fingerprintLines = [
    `- Node ${codefastReport.fingerprint.nodeVersion} / V8 ${codefastReport.fingerprint.v8Version}`,
    `- ${codefastReport.fingerprint.platform}/${codefastReport.fingerprint.arch} · ${codefastReport.fingerprint.cpuModel} × ${String(codefastReport.fingerprint.cpuCount)}`,
    `- NODE_OPTIONS: \`${codefastReport.fingerprint.nodeOptions || "(empty)"}\``,
    `- GC exposed: codefast=${String(codefastReport.fingerprint.gcExposed)}, inversify=${String(inversifyReport.fingerprint.gcExposed)}`,
    `- Library versions: @codefast/di ${codefastReport.fingerprint.libraryVersion}, inversify ${inversifyReport.fingerprint.libraryVersion}`,
    `- Trials per library: ${String(codefastReport.trialCount)} (codefast), ${String(inversifyReport.trialCount)} (inversify)`,
    `- Timestamp: ${codefastReport.fingerprint.timestampIso} (codefast), ${inversifyReport.fingerprint.timestampIso} (inversify)`,
  ].join("\n");

  const sanitySection =
    codefastReport.sanityFailures.length === 0 && inversifyReport.sanityFailures.length === 0
      ? ""
      : [
          "",
          "## Sanity failures",
          "",
          "These scenarios failed their pre-bench sanity check and were skipped:",
          "",
          ...codefastReport.sanityFailures.map((id) => `- **@codefast/di**: \`${id}\``),
          ...inversifyReport.sanityFailures.map((id) => `- **inversify**: \`${id}\``),
        ].join("\n");

  const sections: string[] = [
    "# @codefast/di vs InversifyJS 8 — benchmark report",
    "",
    "## Environment",
    "",
    fingerprintLines,
    sanitySection,
    "",
    "## Comparable scenarios",
    "",
    "Each library runs at its **canonical decorator mode** — inversify with legacy experimental decorators + `reflect-metadata`, @codefast/di with TC39 Stage 3 decorators + `Symbol.metadata`. This measures the shipping experience of each library, not the raw decorator runtimes in isolation.",
    "",
    "Cite these rows when comparing the libraries. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`). `IQR (cf / inv)` is the interquartile range of the per-trial throughput across the trial loop — treat rows above ~5% as noisy.",
    "",
    MARKDOWN_TABLE_HEADER,
    ...comparableRows.map(renderMarkdownRow),
  ];

  if (stressRows.length > 0) {
    sections.push(
      "",
      "## Stress scenarios (not the headline comparison)",
      "",
      "Deep chains and artificially wide fan-outs. Useful as worst-case probes, but **do not** cite these rows as representative performance — real applications almost never wire graphs this shape.",
      "",
      MARKDOWN_TABLE_HEADER,
      ...stressRows.map(renderMarkdownRow),
    );
  }

  if (diagnosticRows.length > 0) {
    sections.push(
      "",
      "## Diagnostic scenarios (baselines, not the headline comparison)",
      "",
      "Microbenchmarks that isolate a single library primitive (e.g. empty-container construction). Kept because they are useful baselines when comparing against a future third library; skip them when reading for head-to-head performance.",
      "",
      MARKDOWN_TABLE_HEADER,
      ...diagnosticRows.map(renderMarkdownRow),
    );
  }

  return sections.filter((section) => section !== undefined).join("\n");
}

const CLI_TABLE_COLUMN_GAP = "  ";

/**
 * Prints the main comparable table to stdout in aligned plain-text form.
 * Stress / diagnostic rows are grouped underneath so `pnpm bench` output
 * stays scannable in a terminal narrower than the markdown version assumes.
 */
export function renderConsoleReport(
  codefastReport: LibraryReport,
  inversifyReport: LibraryReport,
): void {
  const rows = buildComparisonRows(codefastReport, inversifyReport);
  const comparableRows = rows.filter((row) => !row.stress && row.group !== "diagnostic");
  const stressRows = rows.filter((row) => row.stress);
  const diagnosticRows = rows.filter((row) => row.group === "diagnostic" && !row.stress);

  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.id.length));
  const groupColumnWidth = Math.max(10, ...rows.map((row) => row.group.length));

  function printGroup(title: string, subset: readonly ComparisonTableRow[]): void {
    if (subset.length === 0) {
      return;
    }
    const headerLine = [
      "Scenario".padEnd(scenarioColumnWidth),
      "Group".padEnd(groupColumnWidth),
      "codefast hz/op".padStart(16),
      "inversify hz/op".padStart(16),
      "cf/inv".padStart(8),
      "cf mean ms".padStart(12),
      "inv mean ms".padStart(12),
      "cf p99 ms".padStart(12),
      "inv p99 ms".padStart(12),
    ].join(CLI_TABLE_COLUMN_GAP);
    console.log(`\n${title}`);
    console.log(headerLine);
    console.log("-".repeat(headerLine.length));
    for (const row of subset) {
      const ratio = formatThroughputRatio(row.codefastHzPerOp, row.inversifyHzPerOp);
      console.log(
        [
          row.id.padEnd(scenarioColumnWidth),
          row.group.padEnd(groupColumnWidth),
          formatHz(row.codefastHzPerOp).padStart(16),
          formatHz(row.inversifyHzPerOp).padStart(16),
          ratio.padStart(8),
          formatMs(row.codefastMeanMs).padStart(12),
          formatMs(row.inversifyMeanMs).padStart(12),
          formatMs(row.codefastP99Ms).padStart(12),
          formatMs(row.inversifyP99Ms).padStart(12),
        ].join(CLI_TABLE_COLUMN_GAP),
      );
    }
  }

  printGroup("Comparable scenarios", comparableRows);
  printGroup("Stress scenarios (not the headline comparison)", stressRows);
  printGroup("Diagnostic scenarios (baselines, not the headline comparison)", diagnosticRows);

  console.log("");
  console.log(
    "Cite the 'Comparable scenarios' table only. Stress and diagnostic rows are context, not the comparison.",
  );
}

/**
 * One JSONL record = one (library, trial, scenario) observation, with the
 * fingerprint inlined so each line is self-describing. This lets external
 * analysis (pandas, duckdb, jq) pivot without needing the harness metadata
 * again.
 */
interface JsonlObservation {
  readonly timestampIso: string;
  readonly libraryName: string;
  readonly libraryVersion: string;
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly nodeOptions: string;
  readonly gcExposed: boolean;
  readonly trialIndex: number;
  readonly scenarioId: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly hzPerIteration: number;
  readonly hzPerOp: number;
  readonly meanMs: number;
  readonly p75Ms: number;
  readonly p99Ms: number;
  readonly p999Ms: number;
  readonly samples: number;
}

function flattenLibraryToJsonl(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
): JsonlObservation[] {
  const observations: JsonlObservation[] = [];
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      observations.push({
        timestampIso: fingerprint.timestampIso,
        libraryName: fingerprint.libraryName,
        libraryVersion: fingerprint.libraryVersion,
        nodeVersion: fingerprint.nodeVersion,
        v8Version: fingerprint.v8Version,
        platform: fingerprint.platform,
        arch: fingerprint.arch,
        cpuModel: fingerprint.cpuModel,
        cpuCount: fingerprint.cpuCount,
        nodeOptions: fingerprint.nodeOptions,
        gcExposed: fingerprint.gcExposed,
        trialIndex: trial.trialIndex,
        scenarioId: scenarioResult.id,
        group: scenarioResult.group,
        stress: scenarioResult.stress,
        batch: scenarioResult.batch,
        what: scenarioResult.what,
        hzPerIteration: scenarioResult.hzPerIteration,
        hzPerOp: scenarioResult.hzPerOp,
        meanMs: scenarioResult.meanMs,
        p75Ms: scenarioResult.p75Ms,
        p99Ms: scenarioResult.p99Ms,
        p999Ms: scenarioResult.p999Ms,
        samples: scenarioResult.samples,
      });
    }
  }
  return observations;
}

/**
 * Writes the full run to `<outputPath>` as JSONL — one observation per line.
 * Creates the parent directory if necessary. Appends a trailing newline so
 * `wc -l` matches the observation count.
 */
export function writeJsonlRun(
  outputPath: string,
  codefastFingerprint: Fingerprint,
  codefastTrials: readonly TrialPayload[],
  inversifyFingerprint: Fingerprint,
  inversifyTrials: readonly TrialPayload[],
): void {
  const allObservations = [
    ...flattenLibraryToJsonl(codefastFingerprint, codefastTrials),
    ...flattenLibraryToJsonl(inversifyFingerprint, inversifyTrials),
  ];
  const serialised = allObservations.map((observation) => JSON.stringify(observation)).join("\n");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${serialised}\n`, "utf8");
}

/**
 * Writes the markdown report to `<outputPath>`. Overwrites any existing file
 * at that path so repeated runs always reflect the latest bench.
 */
export function writeMarkdownReport(
  outputPath: string,
  codefastReport: LibraryReport,
  inversifyReport: LibraryReport,
): void {
  const markdown = renderMarkdownReport(codefastReport, inversifyReport);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${markdown}\n`, "utf8");
}
