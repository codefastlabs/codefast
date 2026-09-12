/** The progress lines a bench child writes to stderr, and the parser its parent reads them with. */

/**
 * One step of a child's measuring run, as the parent sees it.
 *
 * @remarks Ordinals (`trial`, `scenario`) are one-based, matching the text a person reads on the
 * child's own stderr — the line is the protocol, and the same module both writes and reads it.
 */
export type BenchProgressEvent =
  | { readonly kind: "plan"; readonly trialCount: number; readonly scenarioCount: number }
  | {
      readonly kind: "scenario-done";
      readonly trial: number;
      readonly trialCount: number;
      readonly scenario: number;
      readonly scenarioCount: number;
      readonly scenarioId: string;
    }
  | { readonly kind: "trial-done"; readonly trial: number; readonly trialCount: number }
  | { readonly kind: "finished"; readonly wallTimeMs: number }
  | { readonly kind: "child-started"; readonly scenarioName: string }
  | { readonly kind: "child-completed"; readonly scenarioName: string; readonly listMode: boolean };

const CHILD_STARTED_LINE = /^\[bench\] subprocess (\S+) started$/;
const CHILD_COMPLETED_LINE = /^\[bench\] subprocess (\S+) completed( \(list mode\))?$/;
const PLAN_LINE = /^\[bench\] plan trials=(\d+) scenarios=(\d+)$/;
const SCENARIO_DONE_LINE = /^\[bench\] trial (\d+)\/(\d+) scenario (\d+)\/(\d+) done: (\S+)$/;
const TRIAL_DONE_LINE = /^\[bench\] trial (\d+)\/(\d+) all scenarios finished$/;
const FINISHED_LINE = /^\[bench\] all scenarios wall time: (\d+)ms$/;

/**
 * Formats a progress event as the one stderr line the child prints for it.
 */
export function formatProgressEvent(event: BenchProgressEvent): string {
  switch (event.kind) {
    case "plan": {
      return `[bench] plan trials=${String(event.trialCount)} scenarios=${String(event.scenarioCount)}`;
    }
    case "scenario-done": {
      return `[bench] trial ${String(event.trial)}/${String(event.trialCount)} scenario ${String(event.scenario)}/${String(event.scenarioCount)} done: ${event.scenarioId}`;
    }
    case "trial-done": {
      return `[bench] trial ${String(event.trial)}/${String(event.trialCount)} all scenarios finished`;
    }
    case "finished": {
      return `[bench] all scenarios wall time: ${String(Math.round(event.wallTimeMs))}ms`;
    }
    case "child-started": {
      return `[bench] subprocess ${event.scenarioName} started`;
    }
    case "child-completed": {
      return `[bench] subprocess ${event.scenarioName} completed${event.listMode ? " (list mode)" : ""}`;
    }
  }
}

/**
 * Parses one child stderr line back into its progress event.
 *
 * @returns `undefined` for any line that is not a progress line, so the caller can forward it as a log.
 */
export function parseProgressEvent(line: string): BenchProgressEvent | undefined {
  const trimmed = line.trimEnd();
  const plan = PLAN_LINE.exec(trimmed);
  if (plan !== null) {
    return { kind: "plan", trialCount: Number(plan[1]), scenarioCount: Number(plan[2]) };
  }
  const scenarioDone = SCENARIO_DONE_LINE.exec(trimmed);
  if (scenarioDone !== null) {
    return {
      kind: "scenario-done",
      trial: Number(scenarioDone[1]),
      trialCount: Number(scenarioDone[2]),
      scenario: Number(scenarioDone[3]),
      scenarioCount: Number(scenarioDone[4]),
      scenarioId: scenarioDone[5] ?? "",
    };
  }
  const trialDone = TRIAL_DONE_LINE.exec(trimmed);
  if (trialDone !== null) {
    return { kind: "trial-done", trial: Number(trialDone[1]), trialCount: Number(trialDone[2]) };
  }
  const finished = FINISHED_LINE.exec(trimmed);
  if (finished !== null) {
    return { kind: "finished", wallTimeMs: Number(finished[1]) };
  }
  const childStarted = CHILD_STARTED_LINE.exec(trimmed);
  if (childStarted !== null) {
    return { kind: "child-started", scenarioName: childStarted[1] ?? "" };
  }
  const childCompleted = CHILD_COMPLETED_LINE.exec(trimmed);
  if (childCompleted !== null) {
    return {
      kind: "child-completed",
      scenarioName: childCompleted[1] ?? "",
      listMode: childCompleted[2] !== undefined,
    };
  }
  return undefined;
}
