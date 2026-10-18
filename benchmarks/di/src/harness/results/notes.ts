/** The analysis RESULTS.md carries: why each loss exists and what a user-facing row measures, with no figures. */
import type { LossNote, ResultsNotes, UserFacingNote } from "@internal/benchmark-harness/results/notes";

import { COMPETITORS } from "#harness/config";
import type { DiCompetitorName } from "#harness/config";

/** Every competitor, for a row the page should quote against the whole field. */
const EVERY_COMPETITOR: ReadonlyArray<DiCompetitorName> = COMPETITORS.map((library) => library.libraryName);

/** Startup and one request; the bundle section renders from the footprint record. */
const USER_FACING_NOTES: ReadonlyArray<UserFacingNote<DiCompetitorName>> = [
  {
    title: "Startup",
    lead: "A fresh container, a forty-service graph registered as classes in each library's own idiom (thirty-two singletons, eight transient handlers), and every handler resolved once.",
    rows: [
      { id: "app-boot-40", versus: EVERY_COMPETITOR },
      { id: "realistic-graph-class-cold-resolve", versus: ["ditox", "tsyringe"] },
      { id: "boot-decorated-container-build-and-resolve", versus: ["tsyringe"] },
    ],
    body: "The ten-node rows measure the same path on a smaller graph. Whatever separates codefast from ditox here is the registration the losses below name.",
  },
  {
    title: "One request",
    lead: "A request through a child container: create the child, resolve the request's graph, dispose the child.",
    rows: [
      { id: "production-http-handler", versus: ["ditox", "tsyringe", "awilix", "inversify"] },
      { id: "production-unit-of-work", versus: ["ditox", "tsyringe"] },
      { id: "child-request-lifecycle-create-resolve-dispose", versus: ["ditox", "tsyringe"] },
      { id: "scoped-binding-per-child", versus: ["ditox", "tsyringe"] },
    ],
    body: "Only libraries with a child container run these rows.",
  },
];

/** The paragraph under the bundle table, which the footprint record cannot say. */
const BUNDLE_NOTE =
  "Most of `@codefast/di`'s share is the engine that wins the per-request rows — the resolver, the plan compiler and its code generation — and the checking and describing functions stay out of a program that does not call them.";

/** Every loss shape, ordered by how much it matters. */
const LOSS_NOTES: ReadonlyArray<LossNote<DiCompetitorName>> = [
  {
    title: "Registration, and everything that binds before it resolves",
    kinds: ["real deficit"],
    losses: [
      { id: "bind-128-plain", versus: ["ditox"] },
      { id: "realistic-graph-class-cold-resolve", versus: ["ditox"] },
      { id: "container-create-empty", versus: ["injection-js"] },
      { id: "create-child-empty", versus: ["injection-js"] },
    ],
    context: [
      { id: "bind-128-plain", versus: ["tsyringe", "injection-js"] },
      { id: "app-boot-40", versus: ["ditox", "tsyringe"] },
      { id: "container-create-empty", versus: ["ditox", "tsyringe"] },
      { id: "create-child-empty", versus: ["ditox", "tsyringe"] },
      { id: "module-cold-from-modules", versus: ["ditox"] },
    ],
    body: "`bind-128-plain` binds a hundred and twenty-eight transient factories into a fresh container and resolves nothing. What it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds before it resolves sits on the same floor, and the empty-container rows lose injection-js, whose injector is fewer objects still. With the cold class lane settled, the startup rows that bind classes lose ditox by registration alone. One object per binding is the design, so the deficit is structural.",
  },
  {
    title: "The cold collection, against tsyringe",
    kinds: ["real deficit"],
    losses: [
      { id: "resolve-all-cold-10", versus: ["tsyringe"] },
      { id: "resolve-all-cold-100", versus: ["tsyringe"] },
    ],
    context: [
      { id: "resolve-all-cold-10", versus: ["ditox", "injection-js"] },
      { id: "resolve-all-cold-100", versus: ["ditox", "injection-js"] },
    ],
    body: "`resolve-all-cold-N` builds a fresh container and reads the collection once. What the pair pays is the registration above, once per element, against tsyringe's plain array of providers — the registration cost seen from the collection side.",
  },
  {
    title: "Teardown at scale",
    kinds: ["real deficit", "work difference"],
    losses: [
      { id: "materialize-100-singletons", versus: ["ditox"] },
      { id: "unbind-all-100-singletons", versus: ["ditox"] },
    ],
    context: [
      { id: "materialize-100-singletons", versus: ["tsyringe"] },
      { id: "unbind-all-100-singletons", versus: ["tsyringe"] },
      { id: "lifecycle-pre-destroy-unbind", versus: ["ditox", "tsyringe"] },
    ],
    body: "`materialize-100-singletons` binds and resolves a hundred singletons with no teardown; `unbind-all-100-singletons` does the same, then `unbindAll()` with a hundred `@preDestroy` calls, so the teardown alone is the second row less the first — a difference of two rows, which carries the noise of both. It is the walk plus a method found by name on each instance, where ditox calls the one function it was handed: a work difference. Most of either row sits underneath it, and that part is the real deficit: the bindings, and the first resolve of each, because codefast's side binds a class with `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata costs more than calling a factory.",
  },
  {
    title: "The stable-set collections",
    kinds: ["chosen cost"],
    losses: [
      { id: "resolve-all-strategies-10", versus: ["ditox"] },
      { id: "resolve-all-strategies-100", versus: ["ditox", "injection-js"] },
      { id: "production-event-bus-dispatch", versus: ["ditox"] },
    ],
    context: [
      { id: "resolve-all-strategies-10", versus: ["injection-js"] },
      { id: "production-event-bus-dispatch", versus: ["injection-js"] },
    ],
    body: "A root-level `resolveAll` hands each caller a copy of its memoized list rather than the list itself, so no caller can mutate the engine's memo, while both rivals hand out the cached array they share. The event bus is that copy plus the dispatch. A frozen list was measured and rejected — a frozen array iterates through a slow elements kind for every consumer. The copy is its own commit, reversible alone.",
  },
  {
    title: "Rebind, against ditox",
    kinds: ["work difference"],
    losses: [{ id: "rebind-hot-swap", versus: ["ditox"] }],
    context: [
      { id: "rebind-hot-swap", versus: ["awilix"] },
      { id: "rebind-parent-resolve-child-depth-3", versus: ["awilix", "ditox"] },
    ],
    body: "A rebind of a lone token is one registration whose displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and the deactivation walk.",
  },
  {
    title: "Nested factories and a parent-owned alias, against injection-js",
    kinds: ["harness state", "work difference"],
    losses: [
      { id: "nested-context-resolve-in-factory", versus: ["injection-js"] },
      { id: "nested-container-resolve-in-factory", versus: ["injection-js"] },
      { id: "alias-parent-owned-terminal", versus: ["injection-js"] },
    ],
    context: [
      { id: "alias-chain-3", versus: ["injection-js"] },
      { id: "to-alias-redirect", versus: ["injection-js"] },
      { id: "realistic-graph-resolve-root", versus: ["injection-js"] },
    ],
    body: "The two nested rows are a factory that resolves from its context or from the container mid-construction. Measured on their own, outside the harness, codefast is ahead of injection-js on both. The loss appears in the harness child, which builds every scenario before it measures one, so the factory call site the transient dynamic lane inlines has already seen hundreds of factories and the engine stops inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The alias is structural: injection-js caches an alias's answer in the injector's own slot on the first read, while codefast resolves the alias on every read and never caches a parent's instance in a child.",
  },
  {
    title: "Accessor injection, against inversify",
    kinds: ["work difference"],
    losses: [{ id: "accessor-injection-construct", versus: ["inversify"] }],
    context: [],
    body: "The row measures the benchmark's transpiler as much as the engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`, `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`, which keeps a native private field, resolves several times faster than through esbuild, so the lowering is most of the row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the container, where inversify's property injection is a metadata read on the same plan. The harness stays as it is: a codefast user on tsx or esbuild pays the same lowering, and a different transpiler for one library would move every codefast row, canaries included. Vite's Babel recipe keeps a native private field, as `tsc` does, so a Vite user sits nearer the probe than the row.",
  },
  {
    title: "Failing fast",
    kinds: ["work difference"],
    losses: [{ id: "misconfigured-missing-binding", versus: ["tsyringe", "brandi", "ditox", "injection-js"] }],
    context: [],
    body: "codefast builds a structured error carrying the resolution path; the rivals throw a string, and the stack capture both pay is most of the row. It is a path a production request should never take.",
  },
];

/** Every note the DI results page renders and is checked against. */
export const DI_RESULTS_NOTES: ResultsNotes<DiCompetitorName> = {
  userFacingNotes: USER_FACING_NOTES,
  bundleNote: BUNDLE_NOTE,
  lossNotes: LOSS_NOTES,
};
