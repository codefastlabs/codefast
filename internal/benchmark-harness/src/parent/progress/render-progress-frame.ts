/** Turns a tracker snapshot into the fixed-width lines a terminal shows, one per library. */
import type { LibraryProgress } from "#/parent/progress/progress-tracker";
import { progressFraction } from "#/parent/progress/progress-tracker";
import type { Palette, Tint } from "#/shared/palette";
import { PLAIN_PALETTE } from "#/shared/palette";

/**
 * Layout inputs for one frame.
 *
 * @since 0.9.0
 */
export interface RenderProgressFrameOptions {
  readonly nowMs: number;
  /** Terminal columns; a line never exceeds it, so a redraw never wraps and leaves ghosts. */
  readonly width: number;
  readonly unicode: boolean;
  /** Colour roles; every cell is padded before it is tinted, so codes never disturb alignment. */
  readonly palette?: Palette | undefined;
}

const BAR_CELLS = 20;
const COLUMN_GAP = "  ";

/**
 * Formats a duration the way the frame shows it: tenths of a second under a minute, then minutes.
 *
 * @since 0.9.0
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

const IDENTITY: Tint = (text) => text;

function barTint(row: LibraryProgress, palette: Palette): Tint {
  switch (row.status) {
    case "done": {
      return palette.done;
    }
    case "failed": {
      return palette.failed;
    }
    case "running":
    case "idle": {
      return palette.running;
    }
    case "queued":
    case "discovering": {
      return palette.dim;
    }
  }
}

function renderBar(row: LibraryProgress, unicode: boolean, palette: Palette): string {
  const [filled, empty] = unicode ? ["█", "░"] : ["#", "."];
  const fraction = progressFraction(row);
  const filledCells = fraction === undefined ? 0 : Math.round(Math.min(1, Math.max(0, fraction)) * BAR_CELLS);
  return barTint(row, palette)(filled.repeat(filledCells)) + palette.dim(empty.repeat(BAR_CELLS - filledCells));
}

function tailTint(row: LibraryProgress, palette: Palette): Tint {
  switch (row.status) {
    case "done": {
      return palette.done;
    }
    case "failed": {
      return palette.failed;
    }
    case "queued":
    case "discovering": {
      return palette.dim;
    }
    case "running":
    case "idle": {
      return IDENTITY;
    }
  }
}

function labelTint(row: LibraryProgress, palette: Palette): Tint {
  if (row.status === "running") {
    return palette.heading;
  }
  return row.status === "queued" ? palette.dim : IDENTITY;
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
 *
 * @since 0.9.0
 */
export function renderProgressFrame(
  rows: ReadonlyArray<LibraryProgress>,
  options: RenderProgressFrameOptions,
): Array<string> {
  const labelWidth = Math.max(0, ...rows.map((row) => row.label.length));
  const countsWidth = Math.max(0, ...rows.map((row) => renderCounts(row).length));
  const trialWidth = Math.max(0, ...rows.map((row) => renderTrial(row).length));
  const elapsedWidth = Math.max(0, ...rows.map((row) => renderElapsed(row, options.nowMs).length));

  const palette = options.palette ?? PLAIN_PALETTE;
  const gap = COLUMN_GAP.length;
  const plainHeadWidth =
    labelWidth +
    gap +
    BAR_CELLS +
    (countsWidth === 0 ? 0 : gap + countsWidth) +
    (trialWidth === 0 ? 0 : gap + trialWidth) +
    (elapsedWidth === 0 ? 0 : gap + elapsedWidth);

  // A column nobody fills yet is left out entirely, so an all-queued frame has no doubled gaps.
  // Every cell is padded and clipped as plain text first; colour codes go on last.
  return rows.map((row) => {
    const head = [
      labelTint(row, palette)(row.label.padEnd(labelWidth)),
      renderBar(row, options.unicode, palette),
      ...(countsWidth === 0 ? [] : [renderCounts(row).padStart(countsWidth)]),
      ...(trialWidth === 0 ? [] : [palette.dim(renderTrial(row).padEnd(trialWidth))]),
      ...(elapsedWidth === 0 ? [] : [palette.dim(renderElapsed(row, options.nowMs).padStart(elapsedWidth))]),
    ].join(COLUMN_GAP);
    const tail = renderTail(row);
    const tailWidth = options.width - plainHeadWidth - gap;
    if (tail.length === 0 || tailWidth <= 0) {
      return head;
    }
    return `${head}${COLUMN_GAP}${tailTint(row, palette)(truncate(tail, tailWidth, options.unicode))}`;
  });
}
