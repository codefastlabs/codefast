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

/** What the ledger states about its own runs, apart from the figures. */
export interface LedgerFacts {
  /** The libraries the suite runs the same workloads through, in the ledger's order. */
  readonly libraries: ReadonlyArray<LedgerLibrary>;
  /** The runtime and machine the environment line names, or an empty string when the ledger has none. */
  readonly environment: string;
  /** The most recent dated entry, or null when the ledger has no dated heading. */
  readonly latestEntry: LedgerEntry | null;
  /** The day of the last full re-measure, or null when the ledger records none. */
  readonly lastFullRemeasure: string | null;
}

const ENVIRONMENT_LEAD = "**Environment.**";
const DATED_HEADING = /^## (\d{4}-\d{2}-\d{2}) — (.+)$/m;
const LAST_FULL_REMEASURE = /\*\*Last full re-measure: (\d{4}-\d{2}-\d{2})\*\*/;
const LIBRARY = /^`?([^`\s]+)`?\s+(\S+)$/;

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

/** Reads the ledger's self-description out of its markdown; every field degrades to empty or null, never throws. */
export function parseLedgerFacts(markdown: string): LedgerFacts {
  const paragraph = environmentParagraph(markdown);
  const [environment = ""] = paragraph.split(/\.\s+/);
  const heading = DATED_HEADING.exec(markdown);
  const remeasure = LAST_FULL_REMEASURE.exec(markdown);

  return {
    libraries: librariesOf(paragraph),
    environment: environment.replace(/\.$/, ""),
    latestEntry:
      heading?.[1] !== undefined && heading[2] !== undefined
        ? { date: heading[1], title: heading[2].replaceAll("`", "").trim() }
        : null,
    lastFullRemeasure: remeasure?.[1] ?? null,
  };
}
