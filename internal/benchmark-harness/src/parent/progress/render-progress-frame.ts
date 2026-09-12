/** Turns a tracker snapshot into the fixed-width lines a terminal shows, one per library. */
import type { LibraryProgress } from "#/parent/progress/progress-tracker";
import { progressFraction } from "#/parent/progress/progress-tracker";

/**
 * Layout inputs for one frame.
 */
export interface RenderProgressFrameOptions {
  readonly nowMs: number;
  /** Terminal columns; a line never exceeds it, so a redraw never wraps and leaves ghosts. */
  readonly width: number;
  readonly unicode: boolean;
}

const BAR_CELLS = 20;
const COLUMN_GAP = "  ";

/**
 * Formats a duration the way the frame shows it: tenths of a second under a minute, then minutes.
 */
export function formatElapsed(elapsedMs: number): string {
  const clampedMs = Math.max(0, elapsedMs);
  if (clampedMs < 60_000) {
    return `${(clampedMs / 1000).toFixed(1)}s`;
  }
  const totalSeconds = Math.floor(clampedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}m${String(seconds).padStart(2, "0")}s`;
}

function renderBar(fraction: number | undefined, unicode: boolean): string {
  const [filled, empty] = unicode ? ["█", "░"] : ["#", "."];
  if (fraction === undefined) {
    return empty.repeat(BAR_CELLS);
  }
  const filledCells = Math.round(Math.min(1, Math.max(0, fraction)) * BAR_CELLS);
  return filled.repeat(filledCells) + empty.repeat(BAR_CELLS - filledCells);
}

function renderCounts(row: LibraryProgress): string {
  if (row.scenarioCount === undefined) {
    return "";
  }
  return `${String(row.passScenario)}/${String(row.scenarioCount)}`;
}

function renderTrial(row: LibraryProgress): string {
  if (row.trialCount === undefined || row.trialCount <= 1) {
    return "";
  }
  const trial = row.status === "done" ? row.trialCount : (row.passTrial ?? 1);
  return `t${String(trial)}/${String(row.trialCount)}`;
}

function renderElapsed(row: LibraryProgress, nowMs: number): string {
  if (row.startedAtMs === undefined) {
    return "";
  }
  return formatElapsed((row.finishedAtMs ?? nowMs) - row.startedAtMs);
}

function renderTail(row: LibraryProgress): string {
  switch (row.status) {
    case "queued": {
      return "queued";
    }
    case "discovering": {
      return "discovering scenarios";
    }
    case "running":
    case "idle": {
      return row.currentScenarioId ?? "";
    }
    case "done": {
      return "done";
    }
    case "failed": {
      return row.exitCode === undefined ? "failed" : `failed (exit ${String(row.exitCode)})`;
    }
  }
}

function truncate(text: string, width: number, unicode: boolean): string {
  if (width <= 0) {
    return "";
  }
  if (text.length <= width) {
    return text;
  }
  const ellipsis = unicode ? "…" : "~";
  return width <= ellipsis.length ? "" : text.slice(0, width - ellipsis.length) + ellipsis;
}

/**
 * Renders one line per library, aligned into columns and clipped to the width.
 */
export function renderProgressFrame(
  rows: ReadonlyArray<LibraryProgress>,
  options: RenderProgressFrameOptions,
): Array<string> {
  const labelWidth = Math.max(0, ...rows.map((row) => row.label.length));
  const countsWidth = Math.max(0, ...rows.map((row) => renderCounts(row).length));
  const trialWidth = Math.max(0, ...rows.map((row) => renderTrial(row).length));
  const elapsedWidth = Math.max(0, ...rows.map((row) => renderElapsed(row, options.nowMs).length));

  // A column nobody fills yet is left out entirely, so an all-queued frame has no doubled gaps.
  return rows.map((row) => {
    const columns = [
      row.label.padEnd(labelWidth),
      renderBar(progressFraction(row), options.unicode),
      ...(countsWidth === 0 ? [] : [renderCounts(row).padStart(countsWidth)]),
      ...(trialWidth === 0 ? [] : [renderTrial(row).padEnd(trialWidth)]),
      ...(elapsedWidth === 0 ? [] : [renderElapsed(row, options.nowMs).padStart(elapsedWidth)]),
    ];
    const head = columns.join(COLUMN_GAP);
    const tail = renderTail(row);
    if (tail.length === 0) {
      return truncate(head, options.width, options.unicode);
    }
    return truncate(`${head}${COLUMN_GAP}${tail}`, options.width, options.unicode);
  });
}
