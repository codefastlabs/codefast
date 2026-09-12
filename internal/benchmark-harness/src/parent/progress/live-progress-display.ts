/** In-place progress block for a TTY: one redrawn line per library, logs kept above it. */
import type { ProgressDisplay } from "#/parent/progress/progress-display";
import type { LibraryProgress, RegisterLibraryOptions } from "#/parent/progress/progress-tracker";
import { ProgressTracker } from "#/parent/progress/progress-tracker";
import { renderProgressFrame } from "#/parent/progress/render-progress-frame";
import type { BenchProgressEvent } from "#/shared/progress";

const REDRAW_INTERVAL_MS = 100;
const FALLBACK_WIDTH = 80;
const ESCAPE = String.fromCodePoint(0x1b);

// CSI n A moves the cursor up n lines; CSI 0 J clears from there to the end of the screen.
function cursorUpAndClear(lineCount: number): string {
  return `${ESCAPE}[${String(lineCount)}A${ESCAPE}[0J`;
}

/**
 * Options for {@link LiveProgressDisplay}.
 */
export interface LiveProgressDisplayOptions {
  readonly stream: NodeJS.WriteStream;
  readonly unicode: boolean;
  readonly tracker?: ProgressTracker | undefined;
  readonly now?: (() => number) | undefined;
}

function isTicking(row: LibraryProgress): boolean {
  return row.startedAtMs !== undefined && row.finishedAtMs === undefined;
}

/**
 * Redraws the progress block on every change and every tick while something runs.
 */
export class LiveProgressDisplay implements ProgressDisplay {
  readonly #tracker: ProgressTracker;
  readonly #stream: NodeJS.WriteStream;
  readonly #unicode: boolean;
  readonly #now: () => number;
  #renderedLineCount = 0;
  #lastFrame = "";
  #timer: NodeJS.Timeout | undefined;

  constructor(options: LiveProgressDisplayOptions) {
    this.#stream = options.stream;
    this.#unicode = options.unicode;
    this.#now = options.now ?? (() => performance.now());
    this.#tracker = options.tracker ?? new ProgressTracker(this.#now);
    // Unref'd so a run that dies before `finish()` still lets the process exit.
    this.#timer = setInterval(() => this.#tick(), REDRAW_INTERVAL_MS);
    this.#timer.unref();
  }

  register(key: string, label: string, options?: RegisterLibraryOptions): void {
    this.#tracker.register(key, label, options);
    this.#draw();
  }

  discovering(key: string): void {
    this.#tracker.discovering(key);
    this.#draw();
  }

  setScenarioCount(key: string, scenarioCount: number): void {
    this.#tracker.setScenarioCount(key, scenarioCount);
    this.#draw();
  }

  subprocessStarted(key: string, scenarioId?: string): void {
    this.#tracker.subprocessStarted(key, scenarioId);
    this.#draw();
  }

  event(key: string, event: BenchProgressEvent): void {
    this.#tracker.applyEvent(key, event);
    this.#draw();
  }

  subprocessFinished(key: string, exitCode: number | undefined): void {
    this.#tracker.subprocessFinished(key, exitCode);
    this.#draw();
  }

  libraryDone(key: string): void {
    this.#tracker.libraryDone(key);
    this.#draw();
  }

  libraryFailed(key: string): void {
    this.#tracker.libraryFailed(key);
    this.#draw();
  }

  log(line: string): void {
    this.#clearBlock();
    this.#stream.write(`${line}\n`);
    this.#lastFrame = "";
    this.#draw();
  }

  finish(): void {
    if (this.#timer !== undefined) {
      clearInterval(this.#timer);
      this.#timer = undefined;
    }
    this.#draw();
    // The block stays on screen as the run's final state; later output continues below it.
    this.#renderedLineCount = 0;
  }

  #tick(): void {
    if (this.#tracker.snapshot().some(isTicking)) {
      this.#draw();
    }
  }

  #clearBlock(): void {
    if (this.#renderedLineCount > 0) {
      this.#stream.write(cursorUpAndClear(this.#renderedLineCount));
      this.#renderedLineCount = 0;
    }
  }

  #draw(): void {
    const lines = renderProgressFrame(this.#tracker.snapshot(), {
      nowMs: this.#now(),
      width: Math.max(20, (this.#stream.columns || FALLBACK_WIDTH) - 1),
      unicode: this.#unicode,
    });
    const frame = lines.join("\n");
    if (frame === this.#lastFrame) {
      return;
    }
    this.#clearBlock();
    if (lines.length > 0) {
      this.#stream.write(`${frame}\n`);
    }
    this.#renderedLineCount = lines.length;
    this.#lastFrame = frame;
  }
}
