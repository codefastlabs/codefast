/** Per-library progress state the parent accumulates from subprocess lifecycle and child progress events. */
import type { BenchProgressEvent } from "#/shared/progress";

/**
 * Where a library's run stands.
 *
 * @remarks `idle` only occurs between per-scenario subprocesses of an isolated run; a shared run
 * moves straight from `running` to `done`.
 */
export type LibraryProgressStatus = "queued" | "discovering" | "running" | "idle" | "done" | "failed";

/**
 * What one subprocess covers for a library: its whole suite, or a single scenario of it.
 */
export type SubprocessScope = "suite" | "scenario";

/**
 * A read-only view of one library's progress, in registration order when listed.
 */
export interface LibraryProgress {
  readonly key: string;
  readonly label: string;
  readonly status: LibraryProgressStatus;
  readonly subprocessScope: SubprocessScope;
  /** Scenarios this library measures over the whole run; unknown until planned or discovered. */
  readonly scenarioCount: number | undefined;
  readonly trialCount: number | undefined;
  /** Scenarios finished in the current pass — the current trial for a suite, distinct scenarios for isolation. */
  readonly passScenario: number;
  readonly passTrial: number | undefined;
  /** Every scenario-trial the child has completed, the unit the bar fraction counts in. */
  readonly unitsDone: number;
  readonly currentScenarioId: string | undefined;
  readonly startedAtMs: number | undefined;
  readonly finishedAtMs: number | undefined;
  readonly exitCode: number | undefined;
}

/**
 * Options for registering a library on a tracker.
 */
export interface RegisterLibraryOptions {
  readonly subprocessScope?: SubprocessScope | undefined;
  readonly scenarioCount?: number | undefined;
}

/**
 * Fraction of a library's run that is complete, in scenario-trials, or `undefined` before the total is known.
 */
export function progressFraction(progress: LibraryProgress): number | undefined {
  if (progress.status === "done") {
    return 1;
  }
  if (progress.scenarioCount === undefined || progress.trialCount === undefined) {
    return undefined;
  }
  const totalUnits = progress.scenarioCount * progress.trialCount;
  if (totalUnits === 0) {
    return 1;
  }
  return Math.min(1, progress.unitsDone / totalUnits);
}

/**
 * Accumulates progress for every library of a run; pure state, so it renders identically anywhere.
 */
export class ProgressTracker {
  readonly #rows = new Map<string, LibraryProgress>();
  readonly #now: () => number;

  constructor(now: () => number = () => performance.now()) {
    this.#now = now;
  }

  /** Adds a library row; registering the same key again is a no-op so the order stays stable. */
  register(key: string, label: string, options: RegisterLibraryOptions = {}): void {
    if (this.#rows.has(key)) {
      return;
    }
    this.#rows.set(key, {
      key,
      label,
      status: "queued",
      subprocessScope: options.subprocessScope ?? "suite",
      scenarioCount: options.scenarioCount,
      trialCount: undefined,
      passScenario: 0,
      passTrial: undefined,
      unitsDone: 0,
      currentScenarioId: undefined,
      startedAtMs: undefined,
      finishedAtMs: undefined,
      exitCode: undefined,
    });
  }

  /** Marks a library as running its discovery child, which measures nothing. */
  discovering(key: string): void {
    this.#update(key, (row) => ({ ...row, status: "discovering", startedAtMs: row.startedAtMs ?? this.#now() }));
  }

  /** Sets how many scenarios the library will measure over the run, once the parent knows. */
  setScenarioCount(key: string, scenarioCount: number): void {
    this.#update(key, (row) => ({ ...row, scenarioCount, status: row.status === "discovering" ? "idle" : row.status }));
  }

  /** Records a measuring subprocess starting for the library. */
  subprocessStarted(key: string, scenarioId?: string): void {
    this.#update(key, (row) => ({
      ...row,
      status: "running",
      startedAtMs: row.startedAtMs ?? this.#now(),
      currentScenarioId: scenarioId ?? row.currentScenarioId,
    }));
  }

  /** Applies one progress event the child printed. */
  applyEvent(key: string, event: BenchProgressEvent): void {
    this.#update(key, (row) => {
      switch (event.kind) {
        case "plan": {
          return {
            ...row,
            trialCount: event.trialCount,
            // A per-scenario child always plans one scenario; the parent already set the real total.
            scenarioCount: row.subprocessScope === "suite" ? event.scenarioCount : row.scenarioCount,
          };
        }
        case "scenario-done": {
          return {
            ...row,
            trialCount: event.trialCount,
            passTrial: event.trial,
            passScenario: row.subprocessScope === "suite" ? event.scenario : row.passScenario,
            unitsDone: row.unitsDone + 1,
            currentScenarioId: event.scenarioId,
          };
        }
        case "trial-done": {
          return { ...row, trialCount: event.trialCount, passTrial: event.trial };
        }
        case "finished":
        case "child-started":
        case "child-completed": {
          return row;
        }
      }
    });
  }

  /** Records a measuring subprocess ending; a per-scenario child that succeeded counts one scenario. */
  subprocessFinished(key: string, exitCode: number | undefined): void {
    this.#update(key, (row) => {
      if (exitCode !== 0) {
        return { ...row, status: "failed", exitCode, finishedAtMs: this.#now() };
      }
      if (row.subprocessScope === "scenario") {
        return { ...row, status: "idle", passScenario: row.passScenario + 1, exitCode };
      }
      return { ...row, status: "done", exitCode, finishedAtMs: this.#now() };
    });
  }

  /** Marks a library's whole run complete, which an isolated run only knows after its last scenario. */
  libraryDone(key: string): void {
    this.#update(key, (row) =>
      row.status === "failed" ? row : { ...row, status: "done", finishedAtMs: row.finishedAtMs ?? this.#now() },
    );
  }

  /** Marks a library failed for a reason outside any subprocess exit code. */
  libraryFailed(key: string): void {
    this.#update(key, (row) => ({ ...row, status: "failed", finishedAtMs: row.finishedAtMs ?? this.#now() }));
  }

  /** Every row, in registration order. */
  snapshot(): ReadonlyArray<LibraryProgress> {
    return [...this.#rows.values()];
  }

  /** One row, or `undefined` for an unregistered key. */
  get(key: string): LibraryProgress | undefined {
    return this.#rows.get(key);
  }

  #update(key: string, change: (row: LibraryProgress) => LibraryProgress): void {
    const row = this.#rows.get(key);
    if (row === undefined) {
      return;
    }
    this.#rows.set(key, change(row));
  }
}
