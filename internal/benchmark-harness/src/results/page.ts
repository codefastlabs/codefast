/** Renders a suite's RESULTS.md from its baseline's comparison, bundle record and pass notes, every figure computed. */
import type { ComparisonEntry, ComparisonHeadToHead } from "#report/comparison";
import type {
  ComparisonDocument,
  ComparisonDocumentCell,
  ComparisonDocumentScenario,
} from "#report/comparison-document";
import { formatRatioMultiple, formatThroughputOpsPerSecond } from "#report/format";
import {
  isRatioNoisy,
  isRatioUnreliable,
  isThroughputCellNoisy,
  markRatioQuality,
  markThroughputQuality,
  NOISY_IQR_FRACTION,
  NOISY_IQR_MARKER,
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
} from "#report/reliability";
import { HEAD_TO_HEAD_PARITY_BAND } from "#report/verdict";
import type { FootprintRecord } from "#results/footprint-record";
import type { QuotedRow } from "#results/notes";
import type { ResultsSuite } from "#results/suite";
import { resolveDisplayName } from "#shared/config";

/** Everything the page is rendered from. */
export interface ResultsPageInput {
  readonly suite: ResultsSuite;
  readonly runId: string;
  readonly document: ComparisonDocument;
  readonly footprint: FootprintRecord;
  readonly budgetBytes: number;
  readonly passNotes: string;
}

/** The heading the losses are explained under, which `results.json` names so a reader can link to it. */
export const LOSSES_HEADING = "The losses, foregrounded — where to improve";

/** A scenario's cell against one competitor, located by name. */
interface LocatedCell {
  readonly scenario: ComparisonDocumentScenario;
  readonly cell: ComparisonDocumentCell;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The label a competitor heads its column with, found by the `libraryName` a note quotes it by. */
export function competitorDisplayName(suite: ResultsSuite, name: string): string {
  const library = suite.competitors.find((candidate) => candidate.libraryName === name);
  if (library === undefined) {
    throw new Error(`No competitor named ${name} in the bench config.`);
  }
  return resolveDisplayName(library);
}

function scenarioById(document: ComparisonDocument, id: string): ComparisonDocumentScenario {
  const scenario = document.scenarios.find((candidate) => candidate.id === id);
  if (scenario === undefined) {
    throw new Error(`The baseline has no scenario ${id}.`);
  }
  return scenario;
}

/** Locates a measured cell; a missing scenario or an unmeasured competitor is an error, never a silent dash. */
export function locateCell(suite: ResultsSuite, document: ComparisonDocument, id: string, name: string): LocatedCell {
  const scenario = scenarioById(document, id);
  const displayName = competitorDisplayName(suite, name);
  const cell = scenario.competitors.find((candidate) => candidate.displayName === displayName);
  if (cell === undefined || cell.ratio <= 0) {
    throw new Error(`${displayName} did not measure ${id} in the baseline.`);
  }
  return { scenario, cell };
}

function pivotQuality(scenario: ComparisonDocumentScenario): { hzPerOp: number; iqrFraction: number } {
  return { hzPerOp: scenario.pivotHzPerOp, iqrFraction: scenario.pivotIqrFraction };
}

function markedRatio(scenario: ComparisonDocumentScenario, cell: ComparisonDocumentCell): string {
  return cell.ratio > 0 ? markRatioQuality(formatRatioMultiple(cell.ratio), pivotQuality(scenario), cell) : "—";
}

function markedThroughput(scenario: ComparisonDocumentScenario): string {
  return markThroughputQuality(formatThroughputOpsPerSecond(scenario.pivotHzPerOp), pivotQuality(scenario));
}

function timePerOp(hzPerOp: number): string {
  const nanoseconds = 1e9 / hzPerOp;
  if (nanoseconds < 1000) {
    return `${nanoseconds.toFixed(0)} ns`;
  }
  return nanoseconds < 1e6 ? `${(nanoseconds / 1000).toFixed(1)} µs` : `${(nanoseconds / 1e6).toFixed(2)} ms`;
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

function percent(fraction: number): string {
  return `${String(Math.round(fraction * 100))}%`;
}

function counted(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

function ceilingShorthand(): string {
  return `~${String(Math.round(THROUGHPUT_NOISE_CEILING_HZ_PER_OP / 1e6))}M ops/s`;
}

/** One row quoted against its competitors, each ratio followed by the competitor's name. */
function quoteRow(suite: ResultsSuite, document: ComparisonDocument, row: QuotedRow): string {
  const cells = row.versus.map((name) => {
    const { scenario, cell } = locateCell(suite, document, row.id, name);
    return `${markedRatio(scenario, cell)} ${name}`;
  });
  return `\`${row.id}\` ${joinList(cells)}`;
}

/** Merges rows quoting one scenario, so each id is quoted once with its competitors in first-seen order. */
function mergeRows(rows: ReadonlyArray<QuotedRow>): Array<QuotedRow> {
  const merged = new Map<string, Array<string>>();
  for (const row of rows) {
    const versus = merged.get(row.id) ?? [];
    versus.push(...row.versus.filter((name) => !versus.includes(name)));
    merged.set(row.id, versus);
  }
  return [...merged].map(([id, versus]) => ({ id, versus }));
}

function libraryNameOf(suite: ResultsSuite, displayName: string): string {
  return suite.competitors.find((library) => resolveDisplayName(library) === displayName)?.libraryName ?? displayName;
}

function joinList(items: ReadonlyArray<string>): string {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1) ?? ""}`;
}

function alignTable(header: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>, numericFrom: number) {
  const separator = header.map((_, index) => (index >= numericFrom ? "---:" : "---"));
  return [header, separator, ...rows].map((cells) => `| ${cells.join(" | ")} |`);
}

// ── Sections ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function countCells(document: ComparisonDocument) {
  let ceilingCells = 0;
  let noisyCells = 0;
  const ceilingRows = new Set<string>();
  for (const scenario of document.scenarios) {
    const pivot = pivotQuality(scenario);
    noisyCells += isThroughputCellNoisy(pivot) ? 1 : 0;
    for (const cell of scenario.competitors) {
      if (isRatioUnreliable(scenario.pivotHzPerOp, cell.hzPerOp)) {
        ceilingCells += 1;
        ceilingRows.add(scenario.id);
      }
      noisyCells += isRatioNoisy(pivot, cell) ? 1 : 0;
    }
  }
  return { ceilingCells, ceilingRows: ceilingRows.size, noisyCells };
}

function introSection(input: ResultsPageInput): Array<string> {
  const { document, runId, suite } = input;
  const { ceilingCells, ceilingRows, noisyCells } = countCells(document);
  const eligible = document.scenarios.filter((scenario) => !scenario.excludeFromAggregates).length;
  const trials = String(document.run.trialCount);
  return [
    "# Results",
    "",
    "<!-- Generated by `pnpm bench:results` from `baselines/` and `src/harness/results/notes.ts` — edit those, not this file. -->",
    "",
    `Where \`${suite.subject.libraryName}\` actually stands against the field right now, wins and losses given equal weight — the point of this page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no accreted ledger. The method is in [\`BENCH_GUIDE.md\`](${suite.benchGuide}); re-run it with the recipe at the bottom.`,
    "",
    `**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials, one subprocess per scenario, libraries interleaved with rotating order, ${trials} trials each over the one closure a scenario builds before its first trial — a single pass measures no between-run variance of its own, ${String(noisyCells)} of the cells ${noisyCells === 1 ? "carries" : "carry"} a per-trial IQR above ${percent(NOISY_IQR_FRACTION)}, and ${counted(ceilingCells, "cell")} in ${counted(ceilingRows, "row")} ${ceilingCells === 1 ? "sits" : "sit"} above ${ceilingShorthand()}, where the ratio moves between runs of the same build whatever its IQR says. Ratios are worth more than the absolute \`hz/op\`; a single row is worth less than the group it sits in. A loss below points at a direction — quote a precise factor only after a paired re-run, except where a loss is a structural difference that reproduces by construction.`,
    "",
    `**This page is the baseline.** It is generated from \`baselines/${runId}\`, whose \`observations.jsonl\` and \`footprint.json\` are committed, so every figure here can be re-read from the repository rather than from a local \`bench-results/\` run only the author has. \`baselines/\` holds that one run and nothing else: the next pass is read against it, and a pass accepted in its place becomes this page. ${String(document.run.scenariosMeasured)} scenarios ran, ${String(eligible)} of them aggregate-eligible; ${suite.copy.coverage}`,
  ];
}

function environmentSection(input: ResultsPageInput): Array<string> {
  const { environment, pivot, competitors } = input.document;
  const load =
    environment.loadAverage1m === undefined
      ? ""
      : ` The 1-minute load average read ${environment.loadAverage1m.toFixed(2)} as the subject's child started, on ${String(environment.cpuCount)} cores.`;
  const versions = competitors.map((library) => `${library.libraryName} ${library.libraryVersion}`).join(" · ");
  const sanity = [pivot, ...competitors].reduce((total, library) => total + library.sanityFailures.length, 0);
  return [
    `**Environment.** \`${pivot.libraryName}\` ${pivot.libraryVersion} on Node ${environment.nodeVersion} / V8 ${environment.v8Version}, ${environment.cpuModel} × ${String(environment.cpuCount)}, ${environment.platform}/${environment.arch}, \`${environment.nodeOptions}\` for every library. ${versions}. ${input.suite.copy.environment} Run ${environment.timestampIso.slice(0, 10)}, ${String(sanity)} sanity failures.${load}`,
  ];
}

function passSection(passNotes: string): Array<string> {
  return ["## This pass", "", passNotes.trim()];
}

function summarySection(input: ResultsPageInput): Array<string> {
  const { document, suite } = input;
  const eligible = document.scenarios.filter((scenario) => !scenario.excludeFromAggregates).length;
  const parity = `${(1 - HEAD_TO_HEAD_PARITY_BAND).toFixed(2)}–${(1 + HEAD_TO_HEAD_PARITY_BAND).toFixed(2)}×`;
  const rows = document.headToHead.map(({ displayName, headToHead }) => [
    displayName,
    `${String(headToHead.comparableCount)} of ${String(eligible)}`,
    `${String(headToHead.wins.length)} / ${String(headToHead.parities.length)} / ${String(headToHead.losses.length)}`,
    formatRatioMultiple(headToHead.medianRatio),
    formatRatioMultiple(headToHead.geomeanRatio),
    String(headToHead.unreliableCount),
  ]);
  const behind = document.headToHead.filter(
    ({ headToHead }) => headToHead.medianRatio < 1 || headToHead.geomeanRatio < 1,
  );
  const sweeps = document.headToHead.filter(({ headToHead }) => headToHead.losses.length === 0);
  const headline = [
    behind.length === 0
      ? `**Ahead of every competitor on both aggregates.**`
      : `**Behind ${joinList(behind.map(({ displayName }) => displayName))} on at least one aggregate.**`,
    sweeps.length === 0
      ? "No competitor is swept outright."
      : `${joinList(sweeps.map(({ displayName }) => displayName))} ${sweeps.length === 1 ? "takes" : "take"} no row at all.`,
    ...(document.headToHead.some(({ headToHead }) => headToHead.losses.length > 0)
      ? ["Every loss is named, with its reason, in the section after next."]
      : []),
  ].join(" ");
  return [
    "## Summary — where we stand",
    "",
    `Ratios are \`${suite.subject.libraryName} ÷ competitor\`; above 1× means codefast is faster. Win \`>${(1 + HEAD_TO_HEAD_PARITY_BAND).toFixed(2)}×\`, parity \`${parity}\`, loss \`<${(1 - HEAD_TO_HEAD_PARITY_BAND).toFixed(2)}×\`. \`Comparable\` counts the rows both libraries ran, of ${String(eligible)} aggregate-eligible rows codefast measures; \`${UNRELIABLE_RATIO_MARKER}\` is how many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader should cite one alone.`,
    "",
    ...alignTable(
      ["Competitor", "Comparable", "Win / parity / loss", "Median", "Geomean", UNRELIABLE_RATIO_MARKER],
      rows,
      1,
    ),
    "",
    headline,
  ];
}

function userFacingSection(input: ResultsPageInput): Array<string> {
  const { suite, document, footprint, budgetBytes } = input;
  const notes = suite.notes.userFacingNotes.flatMap((note) => {
    const [first, ...rest] = note.rows;
    const lead = first === undefined ? "" : leadFigure(suite, document, first);
    const others = rest.map((row) => quoteRow(suite, document, row));
    return [
      "",
      `**${note.title}.** ${note.lead} ${lead}${others.length === 0 ? "" : ` Beside it: ${others.join("; ")}.`} ${note.body}`,
    ];
  });
  const subjectLabel = resolveDisplayName(suite.subject);
  const subject = footprint.footprints.find((entry) => entry.label === subjectLabel);
  const ranked = [...footprint.footprints]
    .filter((entry) => !entry.label.startsWith("`"))
    .sort((left, right) => right.gzippedBytes - left.gzippedBytes);
  const rank = subject === undefined ? 0 : ranked.findIndex((entry) => entry.label === subject.label) + 1;
  const bundleRows = footprint.footprints.map((entry) => [
    entry.label,
    kilobytes(entry.minifiedBytes),
    kilobytes(entry.gzippedBytes),
  ]);
  const bundleSummary =
    subject === undefined
      ? ""
      : `\`${subject.label}\` ships ${kilobytes(subject.gzippedBytes)} gzipped, ${ordinal(rank)} largest of ${String(ranked.length)} libraries, against a checked-in budget of ${budgetBytes.toLocaleString("en-US")} B. `;
  return [
    "## What a user waits for",
    "",
    suite.copy.userFacingIntro,
    ...notes,
    "",
    `**Bundle.** ${suite.copy.bundleLead(footprint.bundler)}`,
    "",
    ...alignTable(["Library", "Minified", "Gzipped"], bundleRows, 1),
    "",
    `${bundleSummary}${suite.notes.bundleNote}`,
  ];
}

function ordinal(position: number): string {
  const words = ["", "the", "the second", "the third", "the fourth", "the fifth", "the sixth", "the seventh"];
  return words[position] ?? `number ${String(position)}`;
}

function leadFigure(suite: ResultsSuite, document: ComparisonDocument, row: QuotedRow): string {
  const scenario = scenarioById(document, row.id);
  const cells = row.versus.map((name) => {
    const located = locateCell(suite, document, row.id, name);
    return `${markedRatio(located.scenario, located.cell)} ${name}`;
  });
  return `\`${row.id}\` runs at ${markedThroughput(scenario)} ops/s, about ${timePerOp(scenario.pivotHzPerOp)} each, and reads ${joinList(cells)}.`;
}

function lossSection(input: ResultsPageInput): Array<string> {
  const { suite, document } = input;
  const items = suite.notes.lossNotes.map((note) => {
    const figures = mergeRows([...note.losses, ...note.context])
      .map((row) => quoteRow(suite, document, row))
      .join("; ");
    return `- **${note.title}** — ${note.kinds.join(", ")}. ${figures}. ${note.body}`;
  });
  const covered = new Set(
    suite.notes.lossNotes.flatMap((note) =>
      note.losses.flatMap((row) => row.versus.map((name) => `${row.id}|${competitorDisplayName(suite, name)}`)),
    ),
  );
  const uncovered = document.headToHead.flatMap(({ displayName, headToHead }) =>
    headToHead.losses
      .filter((entry) => !covered.has(`${entry.id}|${displayName}`))
      .map((entry) => `\`${entry.id}\` ${formatEntry(entry)} ${libraryNameOf(suite, displayName)}`),
  );
  const lossCount = document.headToHead.reduce((total, { headToHead }) => total + headToHead.losses.length, 0);
  return [
    `## ${LOSSES_HEADING}`,
    "",
    lossCount === 0
      ? "None: no competitor takes a comparable row from codefast in this pass, above the ceiling or below it."
      : "Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference** (codefast does more per op by design, so the row is a design cost to reconsider, not a bug), a **chosen cost** (a correctness property paid for with its price known), **harness state** (the harness puts the engine in a state a probe of the row alone does not) or **process mode** (a library runs the row at one of two speeds per process, and the pass caught the one that decides it).",
    ...(items.length === 0 ? [] : ["", ...items]),
    ...(uncovered.length === 0
      ? []
      : [
          "",
          `Below parity above the ceiling, with no note of ${uncovered.length === 1 ? "its" : "their"} own: ${joinList(uncovered)}. ${uncovered.length === 1 ? "It is a" : "Each is a"} \`${UNRELIABLE_RATIO_MARKER}\` cell, which moves between runs of the same build.`,
        ]),
  ];
}

function formatEntry(entry: ComparisonEntry): string {
  return `${formatRatioMultiple(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""}`;
}

function rankedGroups(headToHead: ComparisonHeadToHead): string {
  const groups = [...headToHead.groupGeomeans].sort((left, right) => right.geomeanRatio - left.geomeanRatio);
  return groups.map((group) => `\`${group.group}\` ${formatRatioMultiple(group.geomeanRatio)}`).join(", ");
}

function winsSection(document: ComparisonDocument): Array<string> {
  const items = document.headToHead.map(({ displayName, headToHead }) => {
    const parts = [
      `**${displayName} — ${String(headToHead.wins.length)} of ${String(headToHead.comparableCount)} comparable rows, ${formatRatioMultiple(headToHead.medianRatio)} median, ${formatRatioMultiple(headToHead.geomeanRatio)} geomean.**`,
      `By group, widest first: ${rankedGroups(headToHead)}.`,
    ];
    if (headToHead.parities.length > 0) {
      parts.push(
        `At parity: ${joinList(headToHead.parities.map((entry) => `\`${entry.id}\` ${formatEntry(entry)}`))}.`,
      );
    }
    parts.push(
      headToHead.losses.length === 0
        ? "It takes no row."
        : `It takes ${joinList(headToHead.losses.map((entry) => `\`${entry.id}\` ${formatEntry(entry)}`))}.`,
    );
    return `- ${parts.join(" ")}`;
  });
  const excluded = document.scenarios.filter((scenario) => scenario.excludeFromAggregates).length;
  return [
    "## The wins",
    "",
    `Per competitor, its comparable rows and aggregates, its groups from widest to tightest, and every row it does not lose; the ${String(excluded)} rows declared incomparable stay out of every aggregate.`,
    "",
    ...items,
  ];
}

function groupSection(document: ComparisonDocument): Array<string> {
  const groups = [
    ...new Set(document.headToHead.flatMap(({ headToHead }) => headToHead.groupGeomeans.map((entry) => entry.group))),
  ];
  const rows = groups.map((group) => [
    group,
    ...document.headToHead.map(({ headToHead }) => {
      const entry = headToHead.groupGeomeans.find((candidate) => candidate.group === group);
      return entry === undefined ? "—" : `${formatRatioMultiple(entry.geomeanRatio)} (${String(entry.count)})`;
    }),
  ]);
  return [
    "## Geomean by group",
    "",
    "Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.",
    "",
    ...alignTable(["Group", ...document.headToHead.map(({ displayName }) => displayName)], rows, 1),
  ];
}

function scenarioSection(input: ResultsPageInput): Array<string> {
  const { document, suite } = input;
  const excluded = document.scenarios
    .filter((scenario) => scenario.excludeFromAggregates)
    .map((scenario) => scenario.id);
  const rows = document.scenarios.map((scenario) => [
    scenario.id,
    scenario.group,
    String(scenario.batch),
    markedThroughput(scenario),
    ...scenario.competitors.map((cell) => markedRatio(scenario, cell)),
  ]);
  return [
    "## Full per-scenario table",
    "",
    `Every row codefast measures. \`hz/op\` is codefast's throughput per logical operation; a competitor's own throughput is that figure divided by its ratio. \`${UNRELIABLE_RATIO_MARKER}\` a row above the ${ceilingShorthand()} ceiling (ratio moves between runs); \`${NOISY_IQR_MARKER}\` a cell whose per-trial IQR exceeds ${percent(NOISY_IQR_FRACTION)} within this run. ${suite.copy.subjectOnlyRows} ${joinList(excluded.map((id) => `\`${id}\``))} ${excluded.length === 1 ? "is" : "are"} excluded from the aggregates because ${suite.copy.excludedReason}`,
    "",
    ...alignTable(
      [
        "Scenario",
        "Group",
        "batch",
        `${suite.subject.libraryName} hz/op`,
        ...document.competitors.map((library) => `vs ${library.displayName}`),
      ],
      rows,
      2,
    ),
  ];
}

function rerunSection(suite: ResultsSuite): Array<string> {
  return [
    "## Re-running this",
    "",
    "```bash",
    `pnpm bench:baseline            # from ${suite.directory} — a full-profile pass, read against the baseline`,
    "pnpm bench:report              # derive report.md + report.json from the newest run",
    "pnpm bench:footprint           # the bundle table: each library's smallest program, minified and gzipped",
    "pnpm bench:results             # regenerate this page from baselines/",
    "```",
    "",
    "Accepting a pass replaces the one run under `baselines/` with it: move the new run's `observations.jsonl` there in place of the old directory, run `pnpm bench:footprint --save` to record the bundle table beside it, and write its `notes.md` — the commit it measured and what moved since the previous pass, with the paired A/B behind any row the pass flags. Then `pnpm bench:results` rebuilds this page; it refuses to build while a note in `src/harness/results/notes.ts` names a row that no longer loses, while a loss below the ceiling has no note, or while a note carries a figure. CI runs `pnpm bench:results --check`, so the page cannot drift from the baseline it names.",
    "",
    `Before quoting any single loss as a factor rather than a direction, re-measure it paired and alternating on a quiet machine — a full pass carries no between-run variance of its own. The A/B protocol is in [\`BENCH_GUIDE.md\`](${suite.benchGuide}): \`pnpm bench:ab\` swaps the change's \`src\` per side, narrowed to the target rows plus warm canaries, and reads the per-trial spread, not one ratio. ${suite.copy.listing}`,
  ];
}

/** Renders the whole page; the caller formats it. */
export function renderResultsPage(input: ResultsPageInput): string {
  const sections = [
    introSection(input),
    environmentSection(input),
    passSection(input.passNotes),
    summarySection(input),
    userFacingSection(input),
    lossSection(input),
    winsSection(input.document),
    groupSection(input.document),
    scenarioSection(input),
    rerunSection(input.suite),
  ];
  return `${sections.map((lines) => lines.join("\n")).join("\n\n")}\n`;
}
