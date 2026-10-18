/** Holds a suite's analysis notes to its baseline: no figure in the prose, no stale loss, no loss without a note. */
import type { ComparisonDocument } from "#report/comparison-document";
import { HEAD_TO_HEAD_PARITY_BAND } from "#report/verdict";
import type { LossNote, QuotedRow } from "#results/notes";
import { competitorDisplayName, locateCell } from "#results/page";
import type { ResultsSuite } from "#results/suite";

// Code spans and link targets carry ids and paths, which may hold digits; only the prose around them may not.
function proseOf(text: string): string {
  return text.replaceAll(/`[^`]*`/g, "").replaceAll(/\]\([^)]*\)/g, "]");
}

function figureProblems(where: string, text: string): Array<string> {
  return /\d/.test(proseOf(text)) ? [`${where} states a figure; the page renders figures from the baseline.`] : [];
}

function quotedRowProblems(
  suite: ResultsSuite,
  document: ComparisonDocument,
  where: string,
  rows: ReadonlyArray<QuotedRow>,
): Array<string> {
  return rows.flatMap((row) =>
    row.versus.flatMap((name) => {
      try {
        locateCell(suite, document, row.id, name);
        return [];
      } catch (error) {
        return [`${where}: ${error instanceof Error ? error.message : String(error)}`];
      }
    }),
  );
}

function staleLossProblems(suite: ResultsSuite, document: ComparisonDocument, note: LossNote): Array<string> {
  return note.losses.flatMap((row) =>
    row.versus.flatMap((name) => {
      try {
        const { cell } = locateCell(suite, document, row.id, name);
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

function uncoveredLossProblems(suite: ResultsSuite, document: ComparisonDocument): Array<string> {
  const covered = new Set(
    suite.notes.lossNotes.flatMap((note) =>
      note.losses.flatMap((row) =>
        row.versus.map((name) => {
          const library = suite.competitors.find((candidate) => candidate.libraryName === name);
          return `${row.id}|${library === undefined ? name : competitorDisplayName(suite, name)}`;
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

/**
 * Every reason the suite's notes cannot render against this baseline; empty when they can.
 *
 * @since 0.12.0
 */
export function validateResultsNotes(suite: ResultsSuite, document: ComparisonDocument): Array<string> {
  const { notes } = suite;
  return [
    ...figureProblems("The bundle note", notes.bundleNote),
    ...notes.userFacingNotes.flatMap((note) => [
      ...figureProblems(`"${note.title}"`, `${note.title} ${note.lead} ${note.body}`),
      ...quotedRowProblems(suite, document, `"${note.title}"`, note.rows),
    ]),
    ...notes.lossNotes.flatMap((note) => [
      ...figureProblems(`"${note.title}"`, `${note.title} ${note.body}`),
      ...quotedRowProblems(suite, document, `"${note.title}"`, [...note.losses, ...note.context]),
      ...staleLossProblems(suite, document, note),
    ]),
    ...uncoveredLossProblems(suite, document),
  ];
}
