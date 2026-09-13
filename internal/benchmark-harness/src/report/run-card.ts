/** The card that closes a run: what ran, how long, what it found, where it went, and what to do next. */
import { relative } from "node:path";

import type { BenchRunArtifactsResult, BenchRunOutputPaths } from "#/parent/bench-run-artifacts";
import { prefersUnicodeBars } from "#/parent/progress/create-progress-display";
import { formatElapsed } from "#/parent/progress/render-progress-frame";
import type { ComparisonLibrary } from "#/report/comparison";
import type { ComparisonDocument } from "#/report/comparison-document";
import type { BenchRunShape } from "#/shared/env-keys";
import type { Palette } from "#/shared/palette";
import { createPalette } from "#/shared/palette";
import type { TrialPayload } from "#/shared/protocol";

/**
 * Everything the card states.
 */
export interface RunCardInput {
  readonly runId: string;
  readonly shape: BenchRunShape;
  readonly trialCount: number;
  readonly libraryCount: number;
  readonly scenariosMeasured: number;
  readonly scenariosAvailable: number | undefined;
  readonly observationRows: number;
  readonly wallMs: number;
  readonly rebuildMs: number | undefined;
  readonly sanityFailures: ReadonlyArray<{ readonly displayName: string; readonly ids: ReadonlyArray<string> }>;
  readonly artifacts: BenchRunArtifactsResult;
  readonly versions: ReadonlyArray<{ readonly displayName: string; readonly version: string }>;
  /** The run directory relative to the suite, as a person would type it. */
  readonly relativeRunDirectory: string;
  readonly nextCommands: ReadonlyArray<string>;
}

/**
 * Options for {@link renderRunCardLines}.
 */
export interface RenderRunCardOptions {
  readonly palette: Palette;
  readonly width: number;
  readonly unicode: boolean;
}

const KEY_WIDTH = 8;

function orderLine(shape: BenchRunShape): string {
  return shape.isolated
    ? "interleaved per scenario — cross-library ratios citable"
    : "library-major — ratios provisional; run bench:isolate to cite them";
}

function pointerLine(input: RunCardInput): string {
  switch (input.artifacts.latestPointer) {
    case "moved": {
      return "moved to this run";
    }
    case "kept-filtered": {
      return `kept — filtered to ${String(input.scenariosMeasured)} of ${String(input.scenariosAvailable ?? "?")} rows`;
    }
    case "kept-empty": {
      return "kept — the subject measured no rows";
    }
  }
}

// Splits a " · "-joined list across lines so no line exceeds the value width.
function wrapJoined(parts: ReadonlyArray<string>, width: number): Array<string> {
  const lines: Array<string> = [];
  let current = "";
  for (const part of parts) {
    const candidate = current.length === 0 ? part : `${current} · ${part}`;
    if (candidate.length > width && current.length > 0) {
      lines.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

function truncate(text: string, width: number, unicode: boolean): string {
  if (text.length <= width) {
    return text;
  }
  const ellipsis = unicode ? "…" : "~";
  return width <= ellipsis.length ? "" : text.slice(0, width - ellipsis.length) + ellipsis;
}

/**
 * Renders the closing card, boxed to the width, every value padded before it is tinted.
 */
export function renderRunCardLines(input: RunCardInput, options: RenderRunCardOptions): Array<string> {
  const { palette, unicode } = options;
  const width = Math.max(40, options.width);
  const [topLeft, topRight, bottomLeft, bottomRight, horizontal, vertical] = unicode
    ? ["┌", "┐", "└", "┘", "─", "│"]
    : ["+", "+", "+", "+", "-", "|"];
  const innerWidth = width - 4;
  const valueWidth = innerWidth - KEY_WIDTH - 1;

  const trials = `${String(input.trialCount)} trial${input.trialCount === 1 ? "" : "s"}`;
  const profile = `${input.shape.mode} · ${input.shape.isolated ? "isolated" : "shared"} · ${trials}`;
  const rebuild = input.rebuildMs === undefined ? "" : ` · rebuild ${formatElapsed(input.rebuildMs)}`;
  const timing = `wall ${formatElapsed(input.wallMs)}${rebuild} · ${String(input.libraryCount)} libraries · ${String(input.scenariosMeasured)} scenarios · ${String(input.observationRows)} rows`;
  const sanityCount = input.sanityFailures.reduce((total, entry) => total + entry.ids.length, 0);
  const sanity =
    sanityCount === 0
      ? "0 failures"
      : `${String(sanityCount)} failure${sanityCount === 1 ? "" : "s"} — ${input.sanityFailures
          .filter((entry) => entry.ids.length > 0)
          .map((entry) => `${entry.displayName}: ${entry.ids.join(", ")}`)
          .join(" · ")}`;

  const entries: Array<{ key: string; lines: Array<string>; tint?: (text: string) => string }> = [
    { key: "run", lines: [timing] },
    { key: "profile", lines: [profile] },
    { key: "order", lines: [orderLine(input.shape)], tint: palette.dim },
    { key: "sanity", lines: [sanity], tint: sanityCount === 0 ? palette.dim : palette.loss },
    {
      key: "latest",
      lines: [pointerLine(input)],
      tint: input.artifacts.latestPointer === "moved" ? palette.done : palette.dim,
    },
    {
      key: "versions",
      lines: wrapJoined(
        input.versions.map((entry) => `${entry.displayName} ${entry.version}`),
        valueWidth,
      ),
      tint: palette.dim,
    },
    { key: "file", lines: [`${input.relativeRunDirectory}/observations.jsonl`], tint: palette.dim },
    { key: "next", lines: [input.nextCommands.join(" · ")] },
  ];

  const title = ` Run ${input.runId} `;
  const top = `${topLeft}${horizontal}${title}${horizontal.repeat(Math.max(0, width - 3 - title.length))}${topRight}`;
  const bottom = `${bottomLeft}${horizontal.repeat(width - 2)}${bottomRight}`;
  const body = entries.flatMap(({ key, lines, tint }) =>
    lines.map((line, index) => {
      const keyText = (index === 0 ? key : "").padEnd(KEY_WIDTH);
      const valueText = truncate(line, valueWidth, unicode).padEnd(valueWidth);
      return `${palette.dim(vertical)} ${palette.heading(keyText)} ${(tint ?? ((text: string) => text))(valueText)} ${palette.dim(vertical)}`;
    }),
  );
  return [palette.dim(top), ...body, palette.dim(bottom)];
}

/**
 * What a suite's parent entry has in hand when the run is over.
 */
export interface PrintRunCardParameters {
  readonly packageRootDirectory: string;
  readonly paths: BenchRunOutputPaths;
  readonly pivot: ComparisonLibrary;
  readonly competitors: ReadonlyArray<ComparisonLibrary>;
  readonly comparisonDocument: ComparisonDocument;
  readonly artifacts: BenchRunArtifactsResult;
  readonly librariesForJsonl: ReadonlyArray<{ readonly trials: ReadonlyArray<TrialPayload> }>;
  readonly shape: BenchRunShape;
  readonly wallMs: number;
  readonly rebuildMs: number | undefined;
  readonly nextCommands: ReadonlyArray<string>;
}

const MAX_CARD_WIDTH = 120;
const MIN_CARD_WIDTH = 60;

/**
 * Prints the closing card on stdout, sized to the terminal.
 */
export function printRunCard(parameters: PrintRunCardParameters): void {
  const { pivot, competitors, comparisonDocument, paths } = parameters;
  const libraries = [pivot, ...competitors];
  const available = comparisonDocument.run.scenariosAvailable;
  const lines = renderRunCardLines(
    {
      runId: paths.runId,
      shape: parameters.shape,
      trialCount: pivot.report.trialCount,
      libraryCount: libraries.length,
      scenariosMeasured: comparisonDocument.run.scenariosMeasured,
      scenariosAvailable: typeof available === "number" ? available : undefined,
      observationRows: parameters.librariesForJsonl.reduce(
        (total, library) => total + library.trials.reduce((sum, trial) => sum + trial.scenarios.length, 0),
        0,
      ),
      wallMs: parameters.wallMs,
      rebuildMs: parameters.rebuildMs,
      sanityFailures: libraries.map((library) => ({
        displayName: library.displayName,
        ids: library.report.sanityFailures,
      })),
      artifacts: parameters.artifacts,
      versions: libraries.map((library) => ({
        displayName: library.displayName,
        version: library.report.fingerprint.libraryVersion,
      })),
      relativeRunDirectory: relative(parameters.packageRootDirectory, paths.runDirectory),
      nextCommands: parameters.nextCommands,
    },
    {
      palette: createPalette({ stream: process.stdout }),
      width: Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, (process.stdout.columns || 100) - 1)),
      unicode: prefersUnicodeBars(process.env),
    },
  );
  console.log("");
  for (const line of lines) {
    console.log(line);
  }
}
