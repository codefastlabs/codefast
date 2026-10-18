import { describe, expect, it } from "vitest";

import { validateResultsNotes } from "#results/validate";
import { COVERING_NOTES, fixtureDocument, fixtureSuite } from "#tests/unit/results/support/suite";

describe("validateResultsNotes", () => {
  it("accepts notes that cover every loss and state no figure", () => {
    expect(validateResultsNotes(fixtureSuite(), fixtureDocument())).toEqual([]);
  });

  it("reports a loss below the ceiling that no note names", () => {
    const problems = validateResultsNotes(fixtureSuite({ ...COVERING_NOTES, lossNotes: [] }), fixtureDocument());

    expect(problems).toEqual(["slow-row loses to Rival 1 below the ceiling and no loss note names it."]);
  });

  it("reports a loss note naming a row that no longer loses", () => {
    const [note] = COVERING_NOTES.lossNotes;
    const stale = { ...note!, losses: [...note!.losses, { id: "fast-row", versus: ["rival" as const] }] };
    const problems = validateResultsNotes(fixtureSuite({ ...COVERING_NOTES, lossNotes: [stale] }), fixtureDocument());

    expect(problems).toEqual([
      '"The slow row" names fast-row as a loss to rival, which it no longer is — move it to context or drop it.',
    ]);
  });

  it("reports a figure in prose, and allows digits inside code spans and link targets", () => {
    const notes = {
      ...COVERING_NOTES,
      bundleNote: "See `v2` in [the guide](./GUIDE-2.md), which costs 3 KB.",
    };

    expect(validateResultsNotes(fixtureSuite(notes), fixtureDocument())).toEqual([
      "The bundle note states a figure; the page renders figures from the baseline.",
    ]);
    expect(
      validateResultsNotes(
        fixtureSuite({ ...notes, bundleNote: "See `v2` in [the guide](./GUIDE-2.md)." }),
        fixtureDocument(),
      ),
    ).toEqual([]);
  });

  it("reports a quoted row the baseline never measured against the competitor", () => {
    const notes = {
      ...COVERING_NOTES,
      userFacingNotes: [
        { title: "Solo", lead: "Alone.", rows: [{ id: "solo-row", versus: ["rival" as const] }], body: "" },
      ],
    };

    expect(validateResultsNotes(fixtureSuite(notes), fixtureDocument())).toEqual([
      '"Solo": Rival 1 did not measure solo-row in the baseline.',
    ]);
  });
});
