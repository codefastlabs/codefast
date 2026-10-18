/** The analysis RESULTS.md carries: why each loss exists and what a user-facing row measures, with no figures. */
import type { LossNote, ResultsNotes, UserFacingNote } from "@internal/benchmark-harness/results/notes";

import type { TvCompetitorName } from "#harness/config";

/** Defining a component and rendering it; the bundle section renders from the footprint record. */
const USER_FACING_NOTES: ReadonlyArray<UserFacingNote<TvCompetitorName>> = [
  {
    title: "Defining a component",
    lead: "What a module pays as it loads: one component's `tv()` call, and that definition plus its first render.",
    rows: [
      { id: "define-only-simple", versus: ["tailwind-variants"] },
      { id: "define-only-slots", versus: ["tailwind-variants"] },
      { id: "first-render-simple", versus: ["tailwind-variants"] },
      { id: "first-render-slots", versus: ["tailwind-variants"] },
    ],
    body: "An eager library compiles its configuration at definition and a lazy one at the first render, so the definition and first-render rows are read together, and all four stay off the aggregates. `cva` is not ported to them.",
  },
  {
    title: "One render",
    lead: "A component rendered with a selection it has seen before, through `tailwind-merge` — what every render after the first costs.",
    rows: [
      { id: "simple-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "complex-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "slots-with-merge", versus: ["tailwind-variants"] },
    ],
    body: "Both `tv()` libraries answer a repeated selection from a cache, so these rows price the hit path; `cva` caches nothing, so its cells compare a hit against a full computation plus the merge. The `uncached-*` rows in the full table price the miss, on codefast's side alone.",
  },
];

/** The paragraph under the bundle table, which the footprint record cannot say. */
const BUNDLE_NOTE =
  "Most of either `tv()` library's share is `tailwind-merge`, which both call by default; `@codefast/tailwind-variants` takes it as a peer, so an app that already merges its own classes ships one copy. `cva` merges nothing, which is why its with-merge rows call `tailwind-merge` after it.";

/** Every loss shape, ordered by how much it matters. */
const LOSS_NOTES: ReadonlyArray<LossNote<TvCompetitorName>> = [];

/**
 * Every note the tailwind-variants results page renders and is checked against.
 *
 * @since 0.11.0
 */
export const TV_RESULTS_NOTES: ResultsNotes<TvCompetitorName> = {
  userFacingNotes: USER_FACING_NOTES,
  bundleNote: BUNDLE_NOTE,
  lossNotes: LOSS_NOTES,
};
