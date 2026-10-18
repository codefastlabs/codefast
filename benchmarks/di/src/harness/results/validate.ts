/** Holds the analysis notes to the baseline: no figure in the prose, no stale loss, no loss without a note. */
import type { ComparisonDocument } from "@internal/benchmark-harness/report/comparison-document";
import { HEAD_TO_HEAD_PARITY_BAND } from "@internal/benchmark-harness/report/verdict";

import { COMPETITORS } from "#harness/config";
import type { LossNote, QuotedRow, UserFacingNote } from "#harness/results/notes";
import { locateCell } from "#harness/results/page";

/** The notes a baseline is checked against. */
export interface ResultsNotes {
  readonly userFacingNotes: ReadonlyArray<UserFacingNote>;
  readonly bundleNote: string;
  readonly lossNotes: ReadonlyArray<LossNote>;
}

// Code spans and link targets carry ids and paths, which may hold digits; only the prose around them may not.
function proseOf(text: string): string {
  return text.replaceAll(/`[^`]*`/g, "").replaceAll(/\]\([^)]*\)/g, "]");
}

function figureProblems(where: string, text: string): Array<string> {
  return /\d/.test(proseOf(text)) ? [`${where} states a figure; the page renders figures from the baseline.`] : [];
}

function quotedRowProblems(document: ComparisonDocument, where: string, rows: ReadonlyArray<QuotedRow>): Array<string> {
  return rows.flatMap((row) =>
    row.versus.flatMap((name) => {
      try {
        locateCell(document, row.id, name);
        return [];
      } catch (error) {
        return [`${where}: ${error instanceof Error ? error.message : String(error)}`];
      }
    }),
  );
}

function staleLossProblems(document: ComparisonDocument, note: LossNote): Array<string> {
  return note.losses.flatMap((row) =>
    row.versus.flatMap((name) => {
      try {
        const { cell } = locateCell(document, row.id, name);
        return cell.ratio < 1 - HEAD_TO_HEAD_PARITY_BAND
          ? []
          : [
              `"${note.title}" names ${row.id} as a loss to ${name}, which it no longer is — move it to context or drop it.`,
            ];
      } catch {
        // Reported once by quotedRowProblems.
        return [];
      }
    }),
  );
}

function uncoveredLossProblems(document: ComparisonDocument, notes: ResultsNotes): Array<string> {
  const covered = new Set(
    notes.lossNotes.flatMap((note) =>
      note.losses.flatMap((row) =>
        row.versus.map((name) => {
          const library = COMPETITORS.find((candidate) => candidate.libraryName === name);
          return `${row.id}|${library?.displayName ?? name}`;
        }),
      ),
    ),
  );
  return document.headToHead.flatMap(({ displayName, headToHead }) =>
    headToHead.losses
      .filter((entry) => !entry.unreliable && !covered.has(`${entry.id}|${displayName}`))
      .map((entry) => `${entry.id} loses to ${displayName} below the ceiling and no loss note names it.`),
  );
}

/** Every reason the notes cannot render against this baseline; empty when they can. */
export function validateResultsNotes(document: ComparisonDocument, notes: ResultsNotes): Array<string> {
  return [
    ...figureProblems("The bundle note", notes.bundleNote),
    ...notes.userFacingNotes.flatMap((note) => [
      ...figureProblems(`"${note.title}"`, `${note.title} ${note.lead} ${note.body}`),
      ...quotedRowProblems(document, `"${note.title}"`, note.rows),
    ]),
    ...notes.lossNotes.flatMap((note) => [
      ...figureProblems(`"${note.title}"`, `${note.title} ${note.body}`),
      ...quotedRowProblems(document, `"${note.title}"`, [...note.losses, ...note.context]),
      ...staleLossProblems(document, note),
    ]),
    ...uncoveredLossProblems(document, notes),
  ];
}
