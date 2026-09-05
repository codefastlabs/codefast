# `@codefast/tailwind-variants` — design decisions

Why the package exists and the choices that fix its API. [`ARCHITECTURE.md`](./ARCHITECTURE.md) is the source of truth
for the internal shape — the compiled plan, the selection cache, which shapes are load-bearing;
[`README.md`](./README.md) documents the API. Each decision below still holds; a decision that stops holding gets
replaced here, not annotated.

## A drop-in replacement, not a new API

**Context.** `@codefast/ui` styles every component with `tailwind-variants`. Its configuration shape — `base`,
`variants`, `defaultVariants`, `compoundVariants`, `slots`, `compoundSlots`, `extend` — is the right vocabulary; what
fell short was resolution cost on hot render paths and some type-inference edges. Inventing a different API would have
forced a rewrite of the consumer for no gain in expressiveness.

**Decision.** Keep the upstream configuration shape and option names (`twMerge`, `twMergeConfig`) exactly, so the
migration for most codebases is the import specifier. The exports are `tv`, `createTV`, `cn`, `cx`, `VariantProps` and
the configuration types.

**Consequences.** The README's examples run as tests and a behaviour sweep covers the upstream shapes, and
`@codefast/ui` moved over by changing imports. The constraint runs the other way too: an API idea that upstream users
could not express is out of scope here.

## Two verified departures from upstream

**Context.** Upstream's `createTV(options)` returns a bare `tv`, exposes a mutable `defaultConfig`, and ships `cnMerge`.
Global mutable configuration is the one upstream shape that fights the compile-once design below: a plan compiled under
one merge config cannot be trusted after the global changes.

**Decision.** `createTV(options)` returns `{ tv, cn }` that share the options, and there is no mutable global: no
`defaultConfig`, no `cnMerge`. Local `tv(config, options)` still overrides the factory.

**Consequences.** Every resolver knows its merge configuration at compile time. Migration needs one destructure where
upstream assigned `createTV`'s result directly; the README records both departures.

## Settle everything once, on the second call

**Context.** A configuration is fixed the moment `tv` is called; the resolver it returns runs on every render, forever.
Upstream pays for dictionary walks and array flattening on each call. But a design system defines every component at
module load and renders many of them once or not at all on a given page, so work done inside `tv()` is paid by
components that never earn it back.

**Decision.** `tv()` only wraps the configuration. The first call resolves straight from it, through a cold lane that
answers exactly what the plan answers; the second call compiles the plan — flattened class strings, precomputed slot
positions, compound conditions turned into checks — and every call after is string concatenation over that plan.

**Consequences.** A definition and a single render each cost less than upstream's, and a component pays for its plan
only once it has rendered twice. The benchmark suite prices both ends (`define-only-*` and `first-render-*` against the
resolution rows) so the trade stays visible. The cold lane is a second implementation of the resolution rules and is
held to the plan by the behaviour sweep, which drives every case through a fresh resolver as well as a shared one.
Anything that would move work back into the per-render path is a regression, whatever it saves at definition or first
render.

## Cache resolutions per selection, with an opt-out

**Context.** A list renders the same few variant selections thousands of times, and both the plan walk and the merge are
pure functions of the selection.

**Decision.** A resolver remembers what each selection resolved to, in a bounded store keyed by the selection. From the
second call on, slot components return the same object of slot functions for the same selection.
`cacheResolutions: false` disables the store for a component whose values are unique per call.

**Consequences.** Repeated selections cost a lookup. Two things callers must know, and the README says both: the
returned slot object is shared, so it must not be mutated; and a variant fed ids or timestamps should opt out or it
fills the store with entries nothing reads again.

## `tailwind-merge` is a peer, and merging is optional

**Context.** Conflict resolution is what makes `className` overrides safe, but `tailwind-merge` is a sizeable dependency
whose version a design system wants to pin once, not receive twice.

**Decision.** `tailwind-merge >= 3` is a peer dependency, not a dependency; the package ships ESM only with no runtime
dependencies of its own. `twMerge: false` keeps every declared class for callers that resolve conflicts elsewhere, and
`twMergeConfig` extends the class groups for custom themes.

**Consequences.** One copy of `tailwind-merge` per application, at the version the application chose. Callers who turn
merging off own their conflicts.

## Types describe what the selection can be, no more

**Context.** Variant props are the public contract a component's own props extend, so a wrong inference is a wrong
component API.

**Decision.** `VariantProps<typeof resolver>` derives the selection type from the configuration, boolean variants accept
`true`/`false` and default to `false`, and `className` / `class` accept any `ClassValue`. Inference is checked by static
type tests under `tests/types/` alongside the runtime suite.

**Consequences.** A change to the configuration types has to keep those type tests green; that is where a regression in
inference shows up first.

## Performance claims live in the benchmark suite

**Context.** "Faster than upstream" is the package's reason to exist, and a number written into a document rots the day
the code changes.

**Decision.** No figure appears in this file, the README or the source. The first-party suite in
`benchmarks/tailwind-variants` runs the same workloads against `tailwind-variants` and `class-variance-authority` in
isolated subprocesses; its results ledger is the only place a ratio is recorded, and the README tells readers to run it.

**Consequences.** A hot-path change is judged by re-running the suite, not by argument. `ARCHITECTURE.md` states what a
shape guarantees; the suite says what it costs.

## Not built, deliberately

A browser devtools extension, a VS Code extension, a CLI migration tool and CSS-in-JS integration were once listed as a
roadmap. None is scheduled: the migration from upstream is an import change, the type surface already drives editor
completion, and the package stays framework-agnostic by having no runtime beyond string work.

## License

Released under the [MIT License](./LICENSE).
