/** Line-per-milestone progress for logs, pipes and verbose runs: nothing is redrawn. */
import type { ProgressDisplay } from "#/parent/progress/progress-display";
import type { LibraryProgress, RegisterLibraryOptions } from "#/parent/progress/progress-tracker";
import { ProgressTracker } from "#/parent/progress/progress-tracker";
import { formatElapsed } from "#/parent/progress/render-progress-frame";
import type { BenchProgressEvent } from "#/shared/progress";

const HEARTBEAT_SILENCE_MS = 10_000;
const HEARTBEAT_POLL_MS = 1000;

/**
 * Options for {@link PlainProgressDisplay}.
 *
 * @since 0.9.0
 */
export interface PlainProgressDisplayOptions {
  readonly write: (line: string) => void;
  readonly tracker?: ProgressTracker | undefined;
  readonly now?: (() => number) | undefined;
  /** Silence after which a running library gets a "still running" line; `0` disables the heartbeat. */
  readonly heartbeatSilenceMs?: number | undefined;
}

function isSilentlyRunning(
  row: LibraryProgress,
  lastActivityAtMs: number | undefined,
  nowMs: number,
  silenceMs: number,
): boolean {
  return (
    (row.status === "running" || row.status === "discovering") &&
    lastActivityAtMs !== undefined &&
    nowMs - lastActivityAtMs >= silenceMs
  );
}

/**
 * Prints one line when a subprocess starts, plans, finishes or stays silent too long.
 *
 * @since 0.9.0
 */
export class PlainProgressDisplay implements ProgressDisplay {
  readonly #tracker: ProgressTracker;
  readonly #write: (line: string) => void;
  readonly #now: () => number;
  readonly #heartbeatSilenceMs: number;
  readonly #lastActivityAtMs = new Map<string, number>();
  readonly #subprocessStartedAtMs = new Map<string, number>();
  #timer: NodeJS.Timeout | undefined;

  constructor(options: PlainProgressDisplayOptions) {
    this.#write = options.write;
    this.#now = options.now ?? (() => performance.now());
    this.#tracker = options.tracker ?? new ProgressTracker(this.#now);
    this.#heartbeatSilenceMs = options.heartbeatSilenceMs ?? HEARTBEAT_SILENCE_MS;
    if (this.#heartbeatSilenceMs > 0) {
      this.#timer = setInterval(() => this.#heartbeat(), HEARTBEAT_POLL_MS);
      this.#timer.unref();
    }
  }

  register(key: string, label: string, options?: RegisterLibraryOptions): void {
    this.#tracker.register(key, label, options);
  }

  discovering(key: string): void {
    this.#tracker.discovering(key);
    this.#touch(key);
    this.#write(`Discovering ${this.#label(key)} scenarios…`);
  }

  setScenarioCount(key: string, scenarioCount: number): void {
    this.#tracker.setScenarioCount(key, scenarioCount);
    this.#write(`${this.#label(key)}: ${String(scenarioCount)} scenario(s) to measure`);
  }

  subprocessStarted(key: string, scenarioId?: string): void {
    this.#tracker.subprocessStarted(key, scenarioId);
    this.#touch(key);
    this.#subprocessStartedAtMs.set(key, this.#now());
    this.#write(`Running ${this.#label(key)}${scenarioId === undefined ? "" : ` [${scenarioId}]`}…`);
  }

  event(key: string, event: BenchProgressEvent): void {
    this.#tracker.applyEvent(key, event);
    this.#touch(key);
    const row = this.#tracker.get(key);
    if (event.kind === "plan" && row?.subprocessScope === "suite") {
      this.#write(
        `${this.#label(key)}: ${String(event.scenarioCount)} scenario(s) × ${String(event.trialCount)} trial(s)`,
      );
    }
    if (event.kind === "trial-done" && row?.subprocessScope === "suite" && event.trialCount > 1) {
      this.#write(`${this.#label(key)}: trial ${String(event.trial)}/${String(event.trialCount)} finished`);
    }
  }

  subprocessFinished(key: string, exitCode: number | undefined): void {
    const startedAtMs = this.#subprocessStartedAtMs.get(key);
    this.#tracker.subprocessFinished(key, exitCode);
    this.#touch(key);
    const elapsed = startedAtMs === undefined ? "" : ` in ${formatElapsed(this.#now() - startedAtMs)}`;
    this.#write(`${this.#label(key)} subprocess finished${elapsed} (exit ${String(exitCode)}).`);
  }

  libraryDone(key: string): void {
    this.#tracker.libraryDone(key);
    const row = this.#tracker.get(key);
    if (row?.subprocessScope === "scenario") {
      this.#write(`${this.#label(key)}: all ${String(row.passScenario)} scenario(s) measured.`);
    }
  }

  libraryFailed(key: string): void {
    this.#tracker.libraryFailed(key);
    this.#write(`${this.#label(key)} failed.`);
  }

  log(line: string): void {
    this.#write(line);
  }

  finish(): void {
    if (this.#timer !== undefined) {
      clearInterval(this.#timer);
      this.#timer = undefined;
    }
  }

  #label(key: string): string {
    return this.#tracker.get(key)?.label ?? key;
  }

  #touch(key: string): void {
    this.#lastActivityAtMs.set(key, this.#now());
  }

  #heartbeat(): void {
    const nowMs = this.#now();
    for (const row of this.#tracker.snapshot()) {
      if (!isSilentlyRunning(row, this.#lastActivityAtMs.get(row.key), nowMs, this.#heartbeatSilenceMs)) {
        continue;
      }
      const counts =
        row.scenarioCount === undefined ? "" : ` (${String(row.passScenario)}/${String(row.scenarioCount)})`;
      this.#write(`Still running ${row.label}${counts}… ${formatElapsed(nowMs - (row.startedAtMs ?? nowMs))} elapsed`);
      this.#touch(row.key);
    }
  }
}
