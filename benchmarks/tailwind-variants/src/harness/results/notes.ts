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
      { id: "three-renders-simple", versus: ["tailwind-variants"] },
      { id: "three-renders-slots", versus: ["tailwind-variants"] },
    ],
    body: "An eager library compiles its configuration at definition and a lazy one at a later render — codefast at the second — so the definition, first-render and three-render rows are read together, and all six stay off the aggregates. The three-render rows are what a server render or a first page load pays for a component it shows a few times. `cva` is not ported to them.",
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
  {
    title: "What a component calls on every render",
    lead: "The calls a component library makes most: `cn()` over a static class list, a variant resolver handed the caller's `className`, and slots called with theirs.",
    rows: [
      { id: "cn-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "override-with-merge", versus: ["tailwind-variants", "class-variance-authority"] },
      { id: "slot-class-with-merge", versus: ["tailwind-variants"] },
    ],
    body: "Every call site passes its own `className`, usually absent and sometimes overriding a class the variants set, and props arrive as a fresh object per call as React hands them over. `cva` has no `cn` of its own, so its `cn` cell is its clsx-style join followed by `tailwind-merge`, the usual production pairing.",
  },
];

/** The paragraph under the bundle table, which the footprint record cannot say. */
const BUNDLE_NOTE =
  "Most of either `tv()` library's share is its merge engine: `tailwind-variants` ships its own tables, while `@codefast/tailwind-variants` takes `tailwind-merge` as a peer and imports only its `twMerge`, so an app ships one engine, the one it chose. `cva` merges nothing, which is why its with-merge rows call `tailwind-merge` after it.";

/** Every loss shape, ordered by how much it matters. */
const LOSS_NOTES: ReadonlyArray<LossNote<TvCompetitorName>> = [
  {
    title: "A slot called with props leaves the memo",
    kinds: ["real deficit"],
    losses: [{ id: "slot-class-with-merge", versus: ["tailwind-variants"] }],
    context: [{ id: "slots-with-merge", versus: ["tailwind-variants"] }],
    body: "A slot answers a bare call from its per-slot memo, but any props object — even one carrying only an absent `className` — sends it down the override path, which rebuilds the slot's text and merges it on every call. A sub-component calls its slot with the `className` it was given, so this is the common slot call, not the corner. `tailwind-variants` answers a call that carries only `class` or `className` from the cached slot and merges only a class that is actually present. Nothing structural forces the gap: a slot call with no variant override can reuse the memo and merge just the caller's class.",
  },
  {
    title: "`cn` runs the application's merge engine",
    kinds: ["chosen cost"],
    losses: [{ id: "cn-with-merge", versus: ["tailwind-variants"] }],
    context: [{ id: "cn-with-merge", versus: ["class-variance-authority"] }],
    body: "`cn` flattens its arguments and hands the string to `tailwind-merge`'s `twMerge`, which is why it sits level with `cva`'s `cn`, the same join and the same engine. `tailwind-variants` ships its own engine, whose argument cache answers a repeated call before any merge. The package leaves the engine to the application on purpose, so the default pays `tailwind-merge`'s cost, and an application that aliases `tailwind-merge` to a faster drop-in engine moves this row with it.",
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
