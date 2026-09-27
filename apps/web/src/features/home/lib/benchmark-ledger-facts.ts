import { slugify } from "#features/package-docs/lib/markdown/slug";

/** A library the suite compares, with the version the ledger last measured. */
interface LedgerLibrary {
  readonly name: string;
  readonly version: string;
}

/** A dated entry of the ledger: the day it was written and what it found. */
interface LedgerEntry {
  readonly date: string;
  readonly title: string;
}

/** One competitor's line of the suite aggregates: rows won, tied and lost, and the two summary ratios over it. */
interface LedgerAggregate {
  readonly competitor: string;
  readonly wins: number;
  readonly parities: number;
  readonly losses: number;
  readonly median: number;
  readonly geomean: number;
}

/** A row the ledger publishes as a loss: the scenario, the ratio, and the competitor that won it. */
interface LedgerLoss {
  readonly scenario: string;
  readonly ratio: number;
  readonly competitor: string;
}

/** What the ledger states about its own runs: the cast, the profile, the aggregates, and where it loses. */
export interface LedgerFacts {
  /** The libraries the suite runs the same workloads through, the flagship first, in the ledger's order. */
  readonly libraries: ReadonlyArray<LedgerLibrary>;
  /** The runtime and machine the environment paragraph names, or an empty string when the ledger has none. */
  readonly environment: string;
  /** The most recent dated entry, or the pass the ledger records, or null when it dates nothing. */
  readonly latestEntry: LedgerEntry | null;
  /** The day of the last full re-measure, or null when the ledger records none. */
  readonly lastFullRemeasure: string | null;
  /** The profile the suite aggregates were measured under, or an empty string when the ledger states none. */
  readonly aggregateProfile: string;
  /** The suite aggregates table, one line per competitor, in the ledger's order. */
  readonly aggregates: ReadonlyArray<LedgerAggregate>;
  /** The rows the ledger publishes as losses, in the ledger's order. */
  readonly losses: ReadonlyArray<LedgerLoss>;
  /** The GitHub anchor of the section that explains the losses, or an empty string when the ledger has none. */
  readonly lossesAnchor: string;
}

const ENVIRONMENT_LEAD = "**Environment.**";
const DATED_HEADING = /^## (\d{4}-\d{2}-\d{2}) — (.+)$/m;
const HEADING = /^## (.+)$/gm;
const FIRST_HEADING = /^## (.+)$/m;
const LAST_FULL_REMEASURE = /\*\*Last full re-measure: (\d{4}-\d{2}-\d{2})\*\*/;
const RUN_DATE = /\bRun (\d{4}-\d{2}-\d{2})\b/;
const RUNTIME = /Node \d[^,]*,\s*[^,]+,\s*[\w/-]+/;
const LIBRARY = /^`?([^`\s]+)`? (\d+\.\d+\.\d+(?:-[\w.]*\w)?)$/;
// The flagship's version follows its name, or follows the measured commit when that commit is not a release.
const FLAGSHIP = /`?(@codefast\/di)`?(?: at `[\da-f]+` —)? (\d+\.\d+\.\d+(?:-[\w.]*\w)?)/;
const AGGREGATE_HEADER = /^\|[^\n]*Win \/ parity \/ loss[^\n]*$/m;
const AGGREGATE_ROW =
  /^\|\s*([^|]+?)\s*\|(?:\s*\d+ of \d+\s*\|)?\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\|\s*([\d.]+)×\s*\|\s*([\d.]+)×\s*\|/;
const TABLE_RULE = /^\|(?:\s*:?-+:?\s*\|)+$/;
const LOSS = /\*\*`([\w-]+)` — ([\d.]+)× of ([^*]+?)\*\*/g;
const LOSSES_HEADING = /\b(?:loss|losses|loses)\b/i;
const PROFILE_MARK = "subprocess per scenario";

/** The paragraphs of the markdown, blank-line separated, each collapsed to one line. */
function paragraphsOf(markdown: string): Array<string> {
  return markdown.split(/\n\s*\n/).map((paragraph) => paragraph.replaceAll(/\s+/g, " ").trim());
}

/** The body of the `## heading` section, up to the next `## ` heading; empty when the heading is missing. */
function sectionBody(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n## ${heading}`);

  if (start === -1) {
    return "";
  }

  const body = markdown.slice(start + heading.length + 4);
  const end = body.search(/\n## /);

  return end === -1 ? body : body.slice(0, end);
}

/** The environment paragraph as one line, or an empty string when the ledger has none. */
function environmentParagraph(markdown: string): string {
  const start = markdown.indexOf(ENVIRONMENT_LEAD);

  if (start === -1) {
    return "";
  }

  const body = markdown.slice(start + ENVIRONMENT_LEAD.length);
  const end = body.search(/\n\s*\n/);

  return (end === -1 ? body : body.slice(0, end)).replaceAll(/\s+/g, " ").trim();
}

/**
 * The libraries the environment paragraph names, the flagship first, then the `name version · name version`
 * sentence; a library named in both is listed once, and a part the sentence cannot be read as throws.
 */
function librariesOf(paragraph: string): Array<LedgerLibrary> {
  const flagship = FLAGSHIP.exec(paragraph);

  if (flagship?.[1] === undefined || flagship[2] === undefined) {
    throw new Error("The benchmark ledger's environment paragraph names no `@codefast/di` version.");
  }

  const libraries: Array<LedgerLibrary> = [{ name: flagship[1], version: flagship[2] }];
  const sentence = paragraph.split(/\.\s+/).find((part) => part.includes(" · "));

  if (sentence === undefined) {
    throw new Error("The benchmark ledger's environment paragraph has no `name version · name version` sentence.");
  }

  for (const part of sentence.split(" · ")) {
    const match = LIBRARY.exec(part.trim().replace(/\.$/, ""));

    if (match?.[1] === undefined || match[2] === undefined) {
      throw new Error(`The benchmark ledger names a library as "${part.trim()}", not as a name and a version.`);
    }

    if (!libraries.some((known) => known.name === match[1])) {
      libraries.push({ name: match[1], version: match[2] });
    }
  }

  return libraries;
}

/** The runtime and machine the environment paragraph names; a paragraph that names none throws. */
function runtimeOf(paragraph: string): string {
  const runtime = RUNTIME.exec(paragraph)?.[0];

  if (runtime === undefined) {
    throw new Error("The benchmark ledger's environment paragraph names no Node runtime and machine.");
  }

  return runtime;
}

/** The first paragraph that states the profile, with its bold lead-in dropped and its first clause kept. */
function aggregateProfileOf(markdown: string): string {
  const paragraph = paragraphsOf(markdown).find((candidate) => candidate.includes(PROFILE_MARK)) ?? "";
  const [clause = ""] = paragraph.replace(/^\*\*[^*]+\*\*\s*/, "").split(" — ");

  return clause.replaceAll(/[`*]/g, "").replace(/\.$/, "").trim();
}

/**
 * Every competitor line of the table headed `Win / parity / loss`; empty when the ledger has no such table,
 * and a line that is not `competitor | wins / parities / losses | median× | geomean×` throws.
 */
function aggregatesOf(markdown: string): Array<LedgerAggregate> {
  const header = AGGREGATE_HEADER.exec(markdown);

  if (header === null) {
    return [];
  }

  const body = markdown.slice(header.index + header[0].length);
  const end = body.search(/\n\s*\n/);
  const table = end === -1 ? body : body.slice(0, end);
  return table
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !TABLE_RULE.test(line))
    .map((line) => {
      const [, competitor, wins, parities, losses, median, geomean] = AGGREGATE_ROW.exec(line) ?? [];

      if (!competitor || !wins || !parities || !losses || !median || !geomean) {
        throw new Error(`The benchmark ledger's aggregates table has a line it cannot read: ${line}`);
      }

      return {
        competitor,
        wins: Number(wins),
        parities: Number(parities),
        losses: Number(losses),
        median: Number(median),
        geomean: Number(geomean),
      };
    });
}

/** The first `## ` heading about losses, as written; empty when the ledger has none. */
function lossesHeadingOf(markdown: string): string {
  for (const match of markdown.matchAll(HEADING)) {
    const heading = match[1] ?? "";

    if (LOSSES_HEADING.test(heading)) {
      return heading.trim();
    }
  }

  return "";
}

/** Every loss the section leads a paragraph with, as the bold `row — ratio× of competitor` the ledger uses. */
function lossesOf(section: string): Array<LedgerLoss> {
  const losses: Array<LedgerLoss> = [];

  for (const match of section.matchAll(LOSS)) {
    const [, scenario, ratio, competitor] = match;

    if (scenario && ratio && competitor) {
      losses.push({ scenario, ratio: Number(ratio), competitor: competitor.trim() });
    }
  }

  return losses;
}

/** The first dated `## ` entry, else the pass the environment paragraph dates under the first `## ` heading. */
function latestEntryOf(markdown: string, paragraph: string): LedgerEntry | null {
  const heading = DATED_HEADING.exec(markdown);

  if (heading?.[1] !== undefined && heading[2] !== undefined) {
    return { date: heading[1], title: heading[2].replaceAll("`", "").trim() };
  }

  const runDate = RUN_DATE.exec(paragraph)?.[1];
  const first = FIRST_HEADING.exec(markdown)?.[1];

  return runDate === undefined ? null : { date: runDate, title: (first ?? "").replaceAll("`", "").trim() };
}

/**
 * Reads the ledger's self-description out of its markdown; a ledger stating no cast and no aggregates reads as
 * empty facts, and one whose cast or aggregates it cannot read in full, or whose two disagree, throws.
 */
export function parseLedgerFacts(markdown: string): LedgerFacts {
  const paragraph = environmentParagraph(markdown);
  const libraries = paragraph === "" ? [] : librariesOf(paragraph);
  const aggregates = aggregatesOf(markdown);
  const remeasure = LAST_FULL_REMEASURE.exec(markdown)?.[1] ?? RUN_DATE.exec(paragraph)?.[1] ?? null;
  const lossesHeading = lossesHeadingOf(markdown);

  if (aggregates.length !== Math.max(libraries.length - 1, 0)) {
    throw new Error(
      `The benchmark ledger names ${String(libraries.length)} libraries but its aggregates table has ${String(aggregates.length)} lines, not one per competitor.`,
    );
  }

  return {
    libraries,
    environment: paragraph === "" ? "" : runtimeOf(paragraph),
    latestEntry: latestEntryOf(markdown, paragraph),
    lastFullRemeasure: remeasure,
    aggregateProfile: aggregateProfileOf(markdown),
    aggregates,
    losses: lossesOf(sectionBody(markdown, lossesHeading)),
    lossesAnchor: lossesHeading === "" ? "" : slugify(lossesHeading.replaceAll("`", "")),
  };
}
