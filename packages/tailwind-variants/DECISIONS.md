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

**Decision.** Keep the upstream configuration shape and the `twMerge` option name exactly, and resolve every
configuration to what upstream `tailwind-variants` resolves it to, so the migration for most codebases is the import
specifier. The exports are `tv`, `createTV`, `cn`, `cx`, `VariantProps` and the configuration types; where the API
departs from upstream's, the README's migration section lists every difference.

**Consequences.** A unit test paraphrases the README's examples, a behaviour sweep covers the upstream shapes, and
`@codefast/ui` moved over by changing imports. A difference in what a configuration resolves to is a bug, not a
departure. The constraint runs the other way too: an API idea that upstream users could not express is out of scope
here.

## `createTV` returns `{ tv, cn }`, and nothing global is mutable

**Context.** Upstream's `createTV(options)` returns a bare `tv`, exposes a mutable `defaultConfig`, and ships `cnMerge`.
Global mutable configuration is the one upstream shape that fights the compile-once design below: a plan compiled under
one merge config cannot be trusted after the global changes.

**Decision.** `createTV(options)` returns `{ tv, cn }` that share the options, and there is no mutable global: no
`defaultConfig`, no `cnMerge`. Local `tv(config, options)` still overrides the factory, one option at a time.

**Consequences.** Every resolver knows its merge configuration at compile time. Migration needs one destructure where
upstream assigned `createTV`'s result directly, and the README's migration section records it with the other departures.

## Settle everything once, when a component is called again

**Context.** A configuration is fixed the moment `tv` is called; the resolver it returns runs on every render, forever.
Upstream pays for dictionary walks and array flattening on each call. But a design system defines every component at
module load and renders many of them once or not at all on a given page, so work done inside `tv()` is paid by
components that never earn it back.

**Decision.** `tv()` only wraps the configuration. The first calls resolve straight from it, through a cold lane that
answers exactly what the plan answers; the next call compiles the plan — precomputed slot positions, compound conditions
turned into checks, each variant value flattened to a string the first time a call selects it — and every call after is
string concatenation over that plan. A component without slots resolves its first two calls cold, because a cold flat
call costs less than a compile and many components render exactly twice; a slot component compiles on its second,
because a cold slot call costs more.

**Consequences.** A definition and a single render each cost less than upstream's, and a component pays for its plan
only once it has rendered more than that. The benchmark suite prices both ends (`define-only-*`, `first-render-*`,
`two-renders-*` and `three-renders-*` against the resolution rows) so the trade stays visible. The cold lane is a second
implementation of the resolution rules and is held to the plan by the behaviour sweep, which drives every case through a
fresh resolver as well as a shared one. Anything that would move work back into the per-render path is a regression,
whatever it saves at definition or first render.

## Cache resolutions per selection, with an opt-out

**Context.** A list renders the same few variant selections thousands of times, and both the plan walk and the merge are
pure functions of the selection.

**Decision.** A resolver remembers what each selection resolved to, in a bounded store keyed by the selection. From the
second call on, slot components return the same object of slot functions for the same selection.
`cacheResolutions: false` disables the store for a component whose values are unique per call.

**Consequences.** Repeated selections cost a lookup. Two things callers must know, and the README says both: the
returned slot object is shared, so it must not be mutated; and a variant fed ids or timestamps should opt out or it
fills the store with entries nothing reads again.

## The merge engine is `cn`, and the application may replace it

**Context.** Conflict resolution is what makes `className` overrides safe, and every first render, every unseen
`className` and every cold page load runs it on strings no cache has seen. `cn` produces the same output as
`tailwind-merge` — this repository's own class strings agree across both — and merges such a string faster, for a
somewhat larger bundle. A variant library that builds an engine from a configuration at runtime still makes every
application ship the compiler.

**Decision.** `cn >= 0.5` is a peer dependency. The package imports its `twMerge` as the default merge and re-exports
its `cn`, whose own argument cache answers a repeated call before any join. The `twMerge` option takes `true`, `false`,
or a merge function; custom class groups are an `extendTailwindMerge` result from `cn/config` the caller builds and
passes in. There is no `twMergeConfig`, because accepting a configuration means importing the code that compiles one
into every bundle that never uses it.

**Consequences.** One engine per application: an app that still imports `tailwind-merge` aliases it to `cn`. A merge
function passed in replaces the engine only where it is passed: in that resolver, or, given to `createTV`, in its `tv`
and in the `cn` it returns, which then keeps a memo of its own over that merge; the exported `cn` stays the engine's.
The merge runs on a selection a resolver has not answered yet and on a caller's class it has not remembered, so the
engine sets the cost of a first render and of a `className` unique to its call. Callers who turn merging off own their
conflicts.

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

## `className` wins over `class`

**Context.** Upstream applies both `class` and `className` when a call passes the two. Supporting that means reading
`class` on every call, and a component forwarding its `className` almost never passes `class` beside it, so every call
pays for a lookup that answers nothing.

**Decision.** When both are given, `className` is used and `class` is never read — on a resolver call, a slot call and a
compound entry, so one rule covers every place a class prop appears.

**Consequences.** A call forwarding `className` reads one property instead of two, which the `override` and `simple`
rows of the benchmark suite measure. The README's migration section lists the difference from upstream.

## Not built, deliberately

A browser devtools extension, a VS Code extension, a CLI migration tool and CSS-in-JS integration were once listed as a
roadmap. None is scheduled: the migration from upstream is an import change, the type surface already drives editor
completion, and the package stays framework-agnostic by having no runtime beyond string work.

## License

Released under the [MIT License](./LICENSE).
