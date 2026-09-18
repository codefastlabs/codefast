/** Pure reducers turning a paired A/B run's raw observations into the lines its report prints. */
import type { AbRequest } from "#parent/ab-request";
import { parseRunObservations } from "#report/jsonl";

/**
 * One side's narrowed run: its run id and the subject's per-trial `hz/op` for each requested row.
 *
 * @since 0.10.0
 */
export interface SideRun {
  readonly runId: string;
  readonly hzById: ReadonlyMap<string, ReadonlyArray<number>>;
}

/**
 * One experiment: the two sides measured back to back, tagged with which side went first.
 *
 * @since 0.10.0
 */
export interface ExperimentPass {
  readonly experiment: number;
  readonly order: "base→new" | "new→base";
  readonly baseRun: SideRun;
  readonly newRun: SideRun;
}

/**
 * The median of the values, or `undefined` when there are none.
 *
 * @since 0.10.0
 */
export function median(values: ReadonlyArray<number>): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  const lower = sorted[middle - 1];
  if (upper === undefined) {
    return undefined;
  }
  if (sorted.length % 2 === 1 || lower === undefined) {
    return upper;
  }
  return (lower + upper) / 2;
}

function formatHz(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatPercent(fraction: number): string {
  return `${fraction >= 0 ? "+" : ""}${(fraction * 100).toFixed(1)}%`;
}

function formatSpread(values: ReadonlyArray<number>): string {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const middle = median(values);
  const swing = middle === undefined || middle === 0 ? 0 : ((high - low) / middle) * 100;
  return `${formatHz(low)}…${formatHz(high)} (±${swing.toFixed(1)}% of median)`;
}

/**
 * Reads one run's `observations.jsonl` content into the subject's per-row `hz/op` samples.
 *
 * @since 0.10.0
 */
export function extractSubjectHz(
  jsonlContent: string,
  subjectLibraryName: string,
  ids: ReadonlySet<string>,
): ReadonlyMap<string, ReadonlyArray<number>> {
  const subject = parseRunObservations(jsonlContent).libraries.get(subjectLibraryName);
  const hzById = new Map<string, Array<number>>([...ids].map((id) => [id, []]));
  if (subject === undefined) {
    return hzById;
  }
  for (const trial of subject.trials) {
    for (const scenario of trial.scenarios) {
      hzById.get(scenario.id)?.push(scenario.hzPerOp);
    }
  }
  return hzById;
}

/**
 * Builds the console report lines for a completed paired A/B run.
 *
 * @since 0.10.0
 */
export function buildAbReportLines(
  passes: ReadonlyArray<ExperimentPass>,
  request: AbRequest,
  subjectLibraryName: string,
): ReadonlyArray<string> {
  const lines: Array<string> = [];
  const newLabel = request.newRef ?? "working tree";
  lines.push(
    `\n════ A/B ${subjectLibraryName} — new (${newLabel}) vs base (${request.baseRef}) · ${request.mode} · isolate ════`,
  );
  for (const id of request.ids) {
    const baseValues = passes.flatMap((pass) => pass.baseRun.hzById.get(id) ?? []);
    const newValues = passes.flatMap((pass) => pass.newRun.hzById.get(id) ?? []);
    if (baseValues.length === 0 || newValues.length === 0) {
      const missing = baseValues.length === 0 ? `base (${request.baseRef})` : "the new side";
      lines.push(`\n  ${id}: no rows on ${missing} — land the bench row on that ref first.`);
      continue;
    }
    lines.push(`\n  ${id}  (hz/op, higher is faster)`);
    const ratios: Array<number> = [];
    for (const pass of passes) {
      const baseMedian = median(pass.baseRun.hzById.get(id) ?? []);
      const newMedian = median(pass.newRun.hzById.get(id) ?? []);
      if (baseMedian === undefined || newMedian === undefined) {
        continue;
      }
      const ratio = newMedian / baseMedian;
      ratios.push(ratio);
      lines.push(
        `    exp ${String(pass.experiment)} (${pass.order}): base ${formatHz(baseMedian)} · new ${formatHz(newMedian)} · ratio ${ratio.toFixed(4)} (${formatPercent(ratio - 1)})`,
      );
    }
    const medianRatio = median(ratios);
    if (medianRatio !== undefined) {
      lines.push(
        `    median ratio ${medianRatio.toFixed(4)} (${formatPercent(medianRatio - 1)}) — new ${medianRatio > 1 ? "faster" : "slower"}`,
      );
    }
    lines.push(`    base spread ${formatSpread(baseValues)}`);
    lines.push(`    new  spread ${formatSpread(newValues)}`);
  }
  lines.push("\nRun dirs (narrowed — latest.json untouched):");
  for (const pass of passes) {
    lines.push(`  exp ${String(pass.experiment)}: base=${pass.baseRun.runId} · new=${pass.newRun.runId}`);
  }
  return lines;
}
