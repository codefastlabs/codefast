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
  /** The libraries the suite runs the same workloads through, in the ledger's order. */
  readonly libraries: ReadonlyArray<LedgerLibrary>;
  /** The runtime and machine the environment line names, or an empty string when the ledger has none. */
  readonly environment: string;
  /** The most recent dated entry, or null when the ledger has no dated heading. */
  readonly latestEntry: LedgerEntry | null;
  /** The day of the last full re-measure, or null when the ledger records none. */
  readonly lastFullRemeasure: string | null;
  /** The profile the suite aggregates were measured under, or an empty string when the section is missing. */
  readonly aggregateProfile: string;
  /** The suite aggregates table, one line per competitor, in the ledger's order. */
  readonly aggregates: ReadonlyArray<LedgerAggregate>;
  /** The rows the ledger publishes as losses, in the ledger's order. */
  readonly losses: ReadonlyArray<LedgerLoss>;
}

const ENVIRONMENT_LEAD = "**Environment.**";
const DATED_HEADING = /^## (\d{4}-\d{2}-\d{2}) — (.+)$/m;
const LAST_FULL_REMEASURE = /\*\*Last full re-measure: (\d{4}-\d{2}-\d{2})\*\*/;
const LIBRARY = /^`?([^`\s]+)`?\s+(\S+)$/;
const AGGREGATE_ROW = /^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\|\s*([\d.]+)×\s*\|\s*([\d.]+)×\s*\|/gm;
const LOSS = /\*\*`([\w-]+)` — ([\d.]+)× of ([^*]+?)\*\*/g;

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

/** The `name version · name version` sentence of the environment paragraph as libraries; empty when absent. */
function librariesOf(paragraph: string): Array<LedgerLibrary> {
  const sentence = paragraph.split(/\.\s+/).find((part) => part.includes(" · "));

  if (sentence === undefined) {
    return [];
  }

  const libraries: Array<LedgerLibrary> = [];

  for (const part of sentence.split(" · ")) {
    const match = LIBRARY.exec(part.trim().replace(/\.$/, ""));

    if (match?.[1] !== undefined && match[2] !== undefined) {
      libraries.push({ name: match[1], version: match[2] });
    }
  }

  return libraries;
}

/** The first clause of the aggregates section's opening paragraph, with its markdown emphasis removed. */
function aggregateProfileOf(section: string): string {
  const paragraph = section.trim().split(/\n\s*\n/)[0] ?? "";
  const [clause = ""] = paragraph.replaceAll(/\s+/g, " ").split(" — ");

  return clause.replaceAll(/[`*]/g, "").replace(/\.$/, "").trim();
}

/** Every competitor line of the aggregates table; empty when the section or its table is missing. */
function aggregatesOf(section: string): Array<LedgerAggregate> {
  const aggregates: Array<LedgerAggregate> = [];

  for (const match of section.matchAll(AGGREGATE_ROW)) {
    const [, competitor, wins, parities, losses, median, geomean] = match;

    if (competitor && wins && parities && losses && median && geomean) {
      aggregates.push({
        competitor,
        wins: Number(wins),
        parities: Number(parities),
        losses: Number(losses),
        median: Number(median),
        geomean: Number(geomean),
      });
    }
  }

  return aggregates;
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

/** Reads the ledger's self-description out of its markdown; every field degrades to empty or null, never throws. */
export function parseLedgerFacts(markdown: string): LedgerFacts {
  const paragraph = environmentParagraph(markdown);
  const [environment = ""] = paragraph.split(/\.\s+/);
  const heading = DATED_HEADING.exec(markdown);
  const remeasure = LAST_FULL_REMEASURE.exec(markdown);
  const aggregates = sectionBody(markdown, "Suite aggregates");

  return {
    libraries: librariesOf(paragraph),
    environment: environment.replace(/\.$/, ""),
    latestEntry:
      heading?.[1] !== undefined && heading[2] !== undefined
        ? { date: heading[1], title: heading[2].replaceAll("`", "").trim() }
        : null,
    lastFullRemeasure: remeasure?.[1] ?? null,
    aggregateProfile: aggregateProfileOf(aggregates),
    aggregates: aggregatesOf(aggregates),
    losses: lossesOf(sectionBody(markdown, "Where it loses")),
  };
}
