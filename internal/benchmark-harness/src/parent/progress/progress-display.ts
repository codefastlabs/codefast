/** The surface a run drives to show progress, whatever the terminal can draw. */
import type { RegisterLibraryOptions } from "#/parent/progress/progress-tracker";
import type { BenchProgressEvent } from "#/shared/progress";

/**
 * Everything a parent run reports while subprocesses measure.
 *
 * @remarks The live and plain displays share this so the scheduler never asks what the terminal is.
 *
 * @since 0.9.0
 */
export interface ProgressDisplay {
  /** Adds a library row before anything runs, so the whole line-up is visible from the first frame. */
  register(key: string, label: string, options?: RegisterLibraryOptions): void;
  discovering(key: string): void;
  setScenarioCount(key: string, scenarioCount: number): void;
  subprocessStarted(key: string, scenarioId?: string): void;
  event(key: string, event: BenchProgressEvent): void;
  subprocessFinished(key: string, exitCode: number | undefined): void;
  libraryDone(key: string): void;
  libraryFailed(key: string): void;
  /** Writes a line that must stay readable — above the live block, or inline in a plain log. */
  log(line: string): void;
  /** Releases the terminal, leaving the final state on screen. */
  finish(): void;
}
