/** The analysis RESULTS.md carries: why each loss exists and what a user-facing row measures, with no figures. */
import type { LossNote, ResultsNotes, UserFacingNote } from "@internal/benchmark-harness/results/notes";

import type { TvCompetitorName } from "#harness/config";

/** Defining a component and rendering it; the bundle section renders from the footprint record. */
const USER_FACING_NOTES: ReadonlyArray<UserFacingNote<TvCompetitorName>> = [
  {
    title: "Defining a component",
    lead: "What a module pays as it loads: one component's `tv()` call, that definition plus its first render, and plus its first three.",
    rows: [
      { id: "define-only-simple", versus: ["tailwind-variants"] },
      { id: "define-only-slots", versus: ["tailwind-variants"] },
      { id: "first-render-simple", versus: ["tailwind-variants"] },
      { id: "first-render-slots", versus: ["tailwind-variants"] },
      { id: "two-renders-simple", versus: ["tailwind-variants"] },
      { id: "two-renders-slots", versus: ["tailwind-variants"] },
      { id: "three-renders-simple", versus: ["tailwind-variants"] },
      { id: "three-renders-slots", versus: ["tailwind-variants"] },
    ],
    body: "An eager library compiles its configuration at definition and a lazy one at a later render — codefast at the third without slots and the second with them — so the definition, first-render, two-render and three-render rows are read together, and all eight stay off the aggregates. The two- and three-render rows are what a server render or a first page load pays for a component it shows a few times. `cva` is not ported to them.",
  },
  {
    title: "One render",
    lead: "A component rendered with a selection it has seen before, through the merge engine — what every render after the first costs.",
    rows: [
      { id: "simple-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "complex-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "slots-with-merge", versus: ["tailwind-variants"] },
    ],
    body: "Both `tv()` libraries answer a repeated selection from a cache, so these rows price the hit path; `cva` caches nothing, so its cells compare a hit against a full computation plus the merge. The `uncached-*` rows in the full table price the miss, on codefast's side alone.",
  },
  {
    title: "What a component calls on every render",
    lead: "The calls a component library makes most: `cn()` over a static class list, a variant resolver handed the caller's `className`, and slots called with theirs.",
    rows: [
      { id: "cn-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "override-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "slot-class-with-merge", versus: ["tailwind-variants"] },
      { id: "data-cells-with-merge", versus: ["tailwind-variants"] },
    ],
    body: "Every call site passes its own `className`, usually absent and sometimes overriding a class the variants set, and props arrive as a fresh object per call as React hands them over. The table-cell row draws its selections and classes from row and column data, about a thousand distinct calls, rather than from a fixed list of call sites. `cva` has no `cn` of its own, so its `cn` cell is its clsx-style join followed by `tailwind-merge`, the usual production pairing; `@codefast/tailwind-variants` exports the `cn` engine's own `cn`.",
  },
];

/** The paragraph under the bundle table, which the footprint record cannot say. */
const BUNDLE_NOTE =
  "Most of either `tv()` library's share is its merge engine: `tailwind-variants` compiles its own tables into its bundle, while `@codefast/tailwind-variants` takes `cn` as a peer and imports its `twMerge` and `cn`, so an app ships one engine whichever library calls it. `cn` is a little larger than `tailwind-merge` gzipped and smaller minified, and merges a string no cache has seen several times faster. `cva` merges nothing, which is why its with-merge rows call `tailwind-merge` after it.";

/** Every loss shape, ordered by how much it matters. */
const LOSS_NOTES: ReadonlyArray<LossNote<TvCompetitorName>> = [
  {
    title: "A merge no cache has seen runs the engine",
    kinds: ["chosen cost"],
    losses: [{ id: "unique-class-with-merge", versus: ["tailwind-variants"] }],
    context: [{ id: "unique-class-with-merge", versus: ["class-variance-authority"] }],
    body: "Every call here hands the merge a string it has never seen, so no resolution cache or engine cache can answer it, and the row prices the merge engine itself. `@codefast/tailwind-variants` merges with `cn`, which is far ahead of `tailwind-merge` on such a string — hence the lead over `cva`, which pairs with `tailwind-merge` — and close behind the engine `tailwind-variants` compiles into its own bundle. The package takes `cn` as a peer rather than shipping an engine of its own, so an application carries one engine whichever library calls it, and one that injects a faster merge moves this row with it.",
  },
];

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
