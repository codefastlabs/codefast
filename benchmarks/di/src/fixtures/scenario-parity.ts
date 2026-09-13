/**
 * Workload constants and scenario descriptors every head-to-head pair must agree on.
 *
 * The reporter aligns rows by scenario `id` and reads `batch`/`group`/`what` from
 * either side, so a value that drifted between `scenarios/codefast/*` and
 * `scenarios/inversify/*` would silently skew `hzPerOp` or misalign rows. Both
 * sides import from here so parity is enforced by the compiler, not by review
 * discipline. Descriptors carry the codefast wording (the report's left column);
 * the inversify side overrides `what` after the spread where its API vocabulary
 * differs. Constants used by only one side stay local to that scenario file.
 */
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export type ScenarioDescriptor = Pick<BenchScenario, "id" | "group" | "what" | "tier" | "requires"> &
  Partial<Pick<BenchScenario, "excludeFromAggregates" | "facets">>;

// ── micro ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const CONSTANT_RESOLVE_BATCH = 1000;
/**
 * @since 0.5.0-canary.7
 */
export const CLASS_RESOLVE_BATCH = 200;
/**
 * @since 0.5.0-canary.7
 */
export const NAMED_RESOLVE_BATCH = 500;

/**
 * @since 0.5.0-canary.7
 */
export const CONSTANT_RESOLVE = {
  id: "constant-resolve",
  tier: "contract",
  requires: [],
  group: "micro",
  what: "resolve a toConstantValue binding",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SINGLETON_CLASS_1_DEP = {
  id: "singleton-class-1-dep",
  tier: "contract",
  requires: [],
  facets: ["singleton"],
  group: "micro",
  what: "resolve a singleton class with one dependency (cache hit)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const TRANSIENT_CLASS_1_DEP = {
  id: "transient-class-1-dep",
  tier: "contract",
  requires: ["transient"],
  facets: ["transient"],
  group: "micro",
  what: "resolve a transient class with one transient dep (fresh each call)",
} as const satisfies ScenarioDescriptor;

/**
 * The optional-miss path: a transient class whose one optional dependency is unbound, so every
 * resolve reconstructs it and checks the absent optional. Skipped by libraries without real
 * transient scope (their `get` caches, so the optional is checked only once).
 */
export const OPTIONAL_MISSING_TRANSIENT = {
  id: "optional-missing-transient",
  tier: "contract",
  requires: ["optional-injection", "transient"],
  facets: ["optional", "transient"],
  group: "micro",
  what: "resolve a transient class whose one optional dependency is unbound",
} as const satisfies ScenarioDescriptor;

/**
 * The binding counts the one-token selection axes are measured at.
 */
export const SLOT_COUNTS = [1, 4, 16, 64] as const;

/**
 * One point on the named-selection axis: one name picked out of `count` named bindings on a token.
 */
export function namedResolveSlotsDescriptor(count: number): ScenarioDescriptor {
  return {
    id: `named-resolve-slots-${String(count)}`,
    tier: "contract",
    requires: ["name-hint"],
    facets: ["name"],
    group: "micro",
    what: `resolve one named constant out of ${String(count)} named bindings on one token`,
  };
}

/**
 * One point on the tagged-selection axis: one tag picked out of `count` tagged bindings on a token.
 */
export function taggedResolveSlotsDescriptor(count: number): ScenarioDescriptor {
  return {
    id: `tagged-resolve-slots-${String(count)}`,
    tier: "contract",
    requires: ["tag-hint"],
    facets: ["tag"],
    group: "micro",
    what: `resolve one tagged constant out of ${String(count)} tagged bindings on one token`,
  };
}

/**
 * @since 0.5.0-canary.7
 */
export const NAMED_CONSTANT_GET = {
  id: "named-constant-get",
  tier: "contract",
  requires: ["name-hint"],
  facets: ["name"],
  group: "micro",
  what: "resolve a named constant from a 3-candidate set",
} as const satisfies ScenarioDescriptor;

// ── realistic ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const REALISTIC_RESOLVE_BATCH = 20;

/**
 * @since 0.5.0-canary.7
 */
export const REALISTIC_GRAPH_RESOLVE_ROOT = {
  id: "realistic-graph-resolve-root",
  tier: "contract",
  requires: ["transient-root"],
  group: "realistic",
  what: "resolve the transient root of a 10-node graph (hot path, singletons cached)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const REALISTIC_GRAPH_COLD_RESOLVE = {
  id: "realistic-graph-cold-resolve",
  tier: "contract",
  requires: ["transient-root"],
  group: "realistic",
  what: "build a fresh container, bind 10 nodes, resolve root once (cold start)",
} as const satisfies ScenarioDescriptor;

/**
 * The best-vs-best realistic row: explicit-deps factories are the shape both libraries compile
 * ahead of time (codefast's instantiation plans, inversify's plan tree + codegen resolvers).
 *
 * @since 0.5.0-canary.9
 */
export const REALISTIC_GRAPH_RESOLVED_ROOT = {
  id: "realistic-graph-resolved-root",
  tier: "contract",
  requires: ["explicit-deps", "transient-root"],
  group: "realistic",
  what: "resolve the transient root of the 10-node graph bound via explicit-deps factories (each library's compiled path)",
} as const satisfies ScenarioDescriptor;

/**
 * The class-lane hot row: the same graph as constructor-injected classes, each library's own class idiom.
 */
export const REALISTIC_GRAPH_CLASS_RESOLVE_ROOT = {
  id: "realistic-graph-class-resolve-root",
  tier: "contract",
  requires: ["class-injection", "transient-root"],
  group: "realistic",
  what: "resolve the transient root of the 10-node graph bound as constructor-injected classes (each library's class idiom)",
} as const satisfies ScenarioDescriptor;

/**
 * The class-lane cold row: a fresh container, ten class bindings, one root resolve.
 */
export const REALISTIC_GRAPH_CLASS_COLD_RESOLVE = {
  id: "realistic-graph-class-cold-resolve",
  tier: "contract",
  requires: ["class-injection", "transient-root"],
  group: "realistic",
  what: "build a fresh container, bind 10 constructor-injected classes, resolve root once (cold start)",
} as const satisfies ScenarioDescriptor;

/**
 * Per-iteration op count for the two nested-resolve rows.
 */
export const RESOLVER_LANE_BATCH = 300;

/**
 * A transient factory that asks its resolution context for one constant.
 */
export const NESTED_CONTEXT_RESOLVE = {
  id: "nested-context-resolve-in-factory",
  tier: "contract",
  requires: [],
  group: "resolution",
  what: "resolve a transient factory that asks its resolution context for one constant",
} as const satisfies ScenarioDescriptor;

/**
 * The same factory reaching for the container instead of its context.
 */
export const NESTED_CONTAINER_RESOLVE = {
  id: "nested-container-resolve-in-factory",
  tier: "contract",
  requires: [],
  group: "resolution",
  what: "the same transient factory resolving the constant through the container directly",
} as const satisfies ScenarioDescriptor;

/**
 * A class with one dependency injected into a property rather than its constructor.
 */
export const ACCESSOR_INJECTION_CONSTRUCT = {
  id: "accessor-injection-construct",
  tier: "contract",
  requires: ["property-injection"],
  group: "resolution",
  what: "resolve a transient class with one property-injected dependency",
} as const satisfies ScenarioDescriptor;

// ── alias ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Per-iteration op count for the alias rows.
 */
export const ALIAS_BATCH = 500;
/**
 * How many alias hops the chain row walks.
 */
export const ALIAS_CHAIN_HOPS = 3;

/**
 * An alias chain several hops long ending at a cached singleton.
 */
export const ALIAS_CHAIN = {
  id: `alias-chain-${String(ALIAS_CHAIN_HOPS)}`,
  tier: "contract",
  requires: ["alias"],
  facets: ["alias"],
  group: "micro",
  what: `resolve through ${String(ALIAS_CHAIN_HOPS)} chained alias hops to a cached singleton`,
} as const satisfies ScenarioDescriptor;

/**
 * A child's alias whose terminal binding the parent owns.
 */
export const ALIAS_PARENT_OWNED_TERMINAL = {
  id: "alias-parent-owned-terminal",
  tier: "contract",
  requires: ["alias", "child-container"],
  facets: ["alias"],
  group: "micro",
  what: "resolve a child's alias whose terminal singleton the parent owns",
} as const satisfies ScenarioDescriptor;

/**
 * Two aliases pointing at each other, which must fail fast rather than loop.
 */
export const ALIAS_CYCLE_DETECTED = {
  id: "alias-cycle-detected",
  tier: "contract",
  requires: ["alias", "cycle-detection"],
  facets: ["alias"],
  group: "failure",
  what: "resolve an alias that points back at itself and fail fast",
} as const satisfies ScenarioDescriptor;

// ── slot selection ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Per-iteration op count for the slot-selection rows.
 */
export const SLOT_RESOLVE_BATCH = 300;

/**
 * A tag whose value is zero: the one value a truthiness check would drop.
 */
export const SLOT_TAG_ZERO_VALUE = {
  id: "slot-tag-zero-value",
  tier: "contract",
  requires: ["tag-hint"],
  facets: ["tag"],
  group: "slot-selection",
  what: "resolve(token, { tags: [[k, 0]] }) — select by a tag whose value is zero",
} as const satisfies ScenarioDescriptor;

/**
 * A binding selected by its name and its tag together.
 */
export const SLOT_NAME_AND_TAG = {
  id: "slot-name-and-tag",
  tier: "contract",
  requires: ["name-hint", "tag-hint"],
  facets: ["name", "tag"],
  group: "slot-selection",
  what: "resolve(token, { name, tags }) — select by a name and a tag together",
} as const satisfies ScenarioDescriptor;

/**
 * Every binding on a token that carries a tag.
 */
export const SLOT_TAG_RESOLVE_ALL = {
  id: "slot-tag-resolve-all",
  tier: "contract",
  requires: ["resolve-all", "tag-hint"],
  facets: ["tag", "resolve-all"],
  group: "slot-selection",
  what: "resolveAll(token, { tags }) — every binding on the token carrying the tag",
} as const satisfies ScenarioDescriptor;

/**
 * A tagged request over a populated token that matches nothing.
 */
export const SLOT_TAG_MISS_OPTIONAL = {
  id: "slot-tag-miss-optional",
  tier: "contract",
  requires: ["optional", "tag-hint"],
  facets: ["tag", "optional"],
  group: "slot-selection",
  what: "resolveOptional(token, { tags }) that matches no binding — the failed lookup over a populated token",
} as const satisfies ScenarioDescriptor;

/**
 * A tagged binding the parent owns, resolved from a long-lived child.
 */
export const SLOT_TAG_PARENT_OWNED = {
  id: "slot-tag-parent-owned",
  tier: "contract",
  requires: ["child-container", "tag-hint"],
  facets: ["tag"],
  group: "slot-selection",
  what: "resolve(token, { tags }) from a child for a tagged binding the parent owns",
} as const satisfies ScenarioDescriptor;

/**
 * A named binding the parent owns, resolved from a long-lived child.
 */
export const SLOT_NAME_PARENT_OWNED = {
  id: "slot-name-parent-owned",
  tier: "contract",
  requires: ["child-container", "name-hint"],
  facets: ["name"],
  group: "slot-selection",
  what: "resolve(token, { name }) from a child for a named binding the parent owns",
} as const satisfies ScenarioDescriptor;

// ── fan-out ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const FAN_OUT_TREE_BATCH = 20;

/**
 * @since 0.5.0-canary.7
 */
export const FAN_OUT_TREE = {
  id: "fan-out-tree-depth-3-breadth-4",
  tier: "contract",
  requires: ["transient"],
  group: "fan-out",
  what: "resolve transient tree (depth 3, breadth 4; 21 nodes total)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export function resolveAllStrategiesDescriptor(strategyCount: number): ScenarioDescriptor {
  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    tier: "contract",
    requires: ["resolve-all"],
    facets: ["resolve-all"],
    group: "fan-out",
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
  };
}

/**
 * The cold half of the `resolve-all-strategies` pair: a fresh container, N bindings, one collection read.
 *
 * @remarks Reading a stable set rewards a memoised collection; building the set and reading it once
 * charges the memoisation instead, so the pair tells a cached-array advantage from a faster gather.
 */
export function resolveAllColdDescriptor(strategyCount: number): ScenarioDescriptor {
  return {
    id: `resolve-all-cold-${String(strategyCount)}`,
    tier: "contract",
    requires: ["resolve-all"],
    facets: ["resolve-all"],
    group: "fan-out",
    what: `build a fresh container, bind ${String(strategyCount)} strategies, resolveAll() once (cold collection)`,
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function resolveAllNamedDescriptor(namedCount: number): ScenarioDescriptor {
  return {
    id: `resolve-all-named-${String(namedCount)}`,
    tier: "contract",
    requires: ["name-hint", "resolve-all"],
    facets: ["name", "resolve-all"],
    group: "fan-out",
    what: `resolveAll() with name qualifier across ${String(namedCount)} named strategy bindings`,
  };
}

// ── async ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const ASYNC_CHAIN_DEPTH = 8;
/**
 * @since 0.5.0-canary.7
 */
export const ASYNC_CONCURRENT_FANOUT_COUNTS = [8, 16, 32, 64] as const;

/**
 * How many async bindings the async collection row fans across.
 */
export const ASYNC_STRATEGY_COUNT = 8;

/**
 * Every async binding on one token awaited as a collection.
 */
export const RESOLVE_ALL_ASYNC = {
  id: `resolve-all-async-${String(ASYNC_STRATEGY_COUNT)}`,
  tier: "contract",
  requires: ["async-resolve", "resolve-all"],
  facets: ["resolve-all"],
  group: "async",
  what: `resolveAllAsync() across ${String(ASYNC_STRATEGY_COUNT)} async factory bindings on one token`,
} as const satisfies ScenarioDescriptor;

/**
 * The async miss: an unbound token resolved optionally, nothing instantiated.
 */
export const RESOLVE_OPTIONAL_ASYNC_MISS = {
  id: "resolve-optional-async-miss",
  tier: "contract",
  requires: ["async-resolve", "optional"],
  facets: ["optional"],
  group: "async",
  what: "resolveOptionalAsync() when no binding exists — the async miss, resolved without instantiating",
} as const satisfies ScenarioDescriptor;

/**
 * A root awaiting two siblings in parallel that share one async leaf.
 */
export const ASYNC_DIAMOND_SHARED_LEAF = {
  id: "async-diamond-shared-leaf",
  tier: "contract",
  requires: ["async-resolve"],
  group: "async",
  what: "resolveAsync() a root awaiting two siblings in parallel that share one async leaf",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const RESOLVE_ASYNC_SINGLE_HOP = {
  id: "resolve-async-single-hop",
  tier: "contract",
  requires: ["async-resolve"],
  group: "async",
  what: "resolveAsync() one singleton async factory (warm path after first await)",
} as const satisfies ScenarioDescriptor;

/**
 * Awaiting one transient async-constructed value, rebuilt each iteration (cold path).
 */
export const ASYNC_INIT_SINGLE_HOP = {
  id: "async-init-single-hop",
  tier: "contract",
  requires: ["async-value"],
  group: "async",
  what: "await one transient async-constructed value, rebuilt each iteration (cold path)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const DYNAMIC_ASYNC_CHAIN_8 = {
  id: "dynamic-async-chain-8",
  tier: "contract",
  requires: ["async-resolve"],
  group: "async",
  what: "resolveAsync() through an 8-step transient async dynamic chain",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export function asyncFanoutConcurrentDescriptor(concurrency: number): ScenarioDescriptor {
  return {
    id: `async-fanout-concurrent-${String(concurrency)}`,
    tier: "contract",
    requires: ["async-resolve"],
    group: "async",
    what: `resolveAsync ${String(concurrency)} independent async dependencies in parallel via Promise.all (microtask-yield factories)`,
  };
}

// ── lifecycle ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const LIFECYCLE_POST_CONSTRUCT_BATCH = 250;

/**
 * @since 0.5.0-canary.7
 */
export const LIFECYCLE_POST_CONSTRUCT_SINGLETON = {
  id: "lifecycle-post-construct-singleton",
  tier: "contract",
  requires: ["post-construct"],
  facets: ["singleton"],
  group: "lifecycle",
  what: "resolve singleton class with @postConstruct already warmed",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const LIFECYCLE_PRE_DESTROY_UNBIND = {
  id: "lifecycle-pre-destroy-unbind",
  tier: "contract",
  requires: ["deactivation"],
  group: "lifecycle",
  what: "unbind singleton and run onDeactivation + @preDestroy lifecycle",
} as const satisfies ScenarioDescriptor;

/**
 * How many singletons the teardown pair materialises.
 */
export const DISPOSE_SCALE_SINGLETON_COUNT = 100;

/**
 * The baseline of the teardown pair: the singletons exist, nothing is torn down.
 */
export const MATERIALIZE_100_SINGLETONS = {
  id: `materialize-${String(DISPOSE_SCALE_SINGLETON_COUNT)}-singletons`,
  tier: "contract",
  requires: ["deactivation"],
  facets: ["singleton"],
  group: "lifecycle",
  what: `create a container, bind ${String(DISPOSE_SCALE_SINGLETON_COUNT)} singletons with a teardown hook and resolve each once — the row the teardown is read against`,
} as const satisfies ScenarioDescriptor;

/**
 * The teardown half: the same container disposed, every hook run once.
 *
 * @remarks Paired with `lifecycle-pre-destroy-unbind`, which tears down one singleton: this row is
 * where finding what to tear down shows up.
 */
export const UNBIND_ALL_100_SINGLETONS = {
  id: `unbind-all-${String(DISPOSE_SCALE_SINGLETON_COUNT)}-singletons`,
  tier: "contract",
  requires: ["deactivation", "dispose"],
  facets: ["singleton"],
  group: "lifecycle",
  what: `the same container, then dispose it — the walk over ${String(DISPOSE_SCALE_SINGLETON_COUNT)} materialised singletons plus one teardown hook each`,
} as const satisfies ScenarioDescriptor;

/**
 * Per-iteration op count for the chain-rebind row.
 */
export const CHAIN_REBIND_BATCH = 50;
/**
 * How deep the chain-rebind row resolves from.
 */
export const CHAIN_REBIND_DEPTH = 3;

/**
 * A rebind in the root read from the far end of a container chain.
 */
export const REBIND_PARENT_RESOLVE_CHILD_DEPTH_3 = {
  id: `rebind-parent-resolve-child-depth-${String(CHAIN_REBIND_DEPTH)}`,
  tier: "contract",
  requires: ["child-container", "rebind"],
  facets: ["scope"],
  group: "lifecycle",
  what: `rebind in the root, then resolve from a depth-${String(CHAIN_REBIND_DEPTH)} child — the whole chain's cached lookup invalidated per iteration`,
} as const satisfies ScenarioDescriptor;

// ── scope ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const CHILD_RESOLVE_BATCH = 500;
/**
 * @since 0.5.0-canary.7
 */
export const REQUEST_LIFECYCLE_BATCH = 100;

/**
 * Per-iteration op count for the fresh-child rows.
 */
export const FRESH_CHILD_BATCH = 100;
/**
 * The duty cycles the fresh-child rows are measured at: a memo paid once and never reused, then amortised.
 */
export const FRESH_CHILD_RESOLVES = [1, 4] as const;

/**
 * The selection criterion a fresh-child row resolves with.
 */
export type FreshChildLane = "default" | "name" | "tag";

const FRESH_CHILD_CRITERIA: Readonly<Record<FreshChildLane, string>> = {
  default: "resolve(token)",
  name: "resolve(token, { name })",
  tag: "resolve(token, { tags })",
};

/**
 * One cell of the fresh-child matrix: a criterion resolved N times inside a per-request child, then teardown.
 */
export function freshChildDescriptor(lane: FreshChildLane, resolvesPerChild: number): ScenarioDescriptor {
  const laneRequires = lane === "name" ? ["name-hint" as const] : lane === "tag" ? ["tag-hint" as const] : [];
  return {
    id: `fresh-child-${lane}-n${String(resolvesPerChild)}`,
    tier: "contract",
    requires: ["child-container", "dispose", ...laneRequires],
    facets: ["scope", ...(lane === "default" ? [] : [lane])],
    group: "scope",
    what: `${FRESH_CHILD_CRITERIA[lane]} ${String(resolvesPerChild)}× inside a per-request child, then teardown — the criterion's per-container cost at duty cycle ${String(resolvesPerChild)}`,
  };
}

/**
 * The child depths the parent-walk axis is measured at; depth 2 is the realistic per-request shape.
 */
export const CHILD_DEPTHS = [1, 2, 4, 8] as const;

/**
 * One point on the parent-walk axis: a root binding resolved from a child `depth` levels down.
 *
 * @remarks A single depth cannot tell a walk that is free from one that is linear in the chain; the
 * axis can.
 */
export function childDepthResolveDescriptor(depth: number): ScenarioDescriptor {
  return {
    id: `child-depth-${String(depth)}-resolve`,
    tier: "contract",
    requires: ["child-container"],
    facets: ["scope"],
    group: "scope",
    what: `resolve a root binding from a depth-${String(depth)} child — the parent walk a per-request container pays`,
  };
}

/**
 * @since 0.5.0-canary.7
 */
export const CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE = {
  id: "child-request-lifecycle-create-resolve-dispose",
  tier: "contract",
  requires: ["child-container", "dispose"],
  facets: ["scope"],
  group: "scope",
  what: "create per-request child container, resolve from grandchild depth-2, then unbind/dispose",
} as const satisfies ScenarioDescriptor;

// ── scale ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const SCALE_CHAIN_SIZE = 512;

/**
 * The mid-depth chain size, measured explicitly so the report can't hide it behind depth 512.
 *
 * @remarks
 * The transient-dynamic deep-lane only amortizes its shared-context machinery past ~depth 100,
 * so ~32 (the deep-lane handoff) is where the resolver is weakest vs inversify.
 *
 * @since 0.5.0-canary.7
 */
export const SCALE_MID_CHAIN_SIZE = 32;

/**
 * @since 0.5.0-canary.7
 */
export const SCALE_DEEP_TRANSIENT_CHAIN_512 = {
  id: "scale-deep-transient-chain-512",
  tier: "contract",
  requires: ["transient"],
  facets: ["transient"],
  group: "scale",
  what: "resolve a 512-step transient chain (500+ binding registry pressure)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SCALE_MID_TRANSIENT_CHAIN_32 = {
  id: "scale-mid-transient-chain-32",
  tier: "contract",
  requires: ["transient"],
  facets: ["transient"],
  group: "scale",
  what: "resolve a 32-step transient chain (deep-lane handoff depth — resolver's weakest transient band)",
} as const satisfies ScenarioDescriptor;

// ── boot ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Per-iteration op count for the two container-construction rows.
 */
export const CONTAINER_CREATE_BATCH = 100;
/**
 * How many tokens the bind-path row registers.
 */
export const BIND_TOKEN_COUNT = 128;

/**
 * An empty container: construction alone, unbundled from any bind or resolve.
 */
export const CONTAINER_CREATE_EMPTY = {
  id: "container-create-empty",
  tier: "contract",
  requires: [],
  group: "boot",
  what: "create a container with nothing bound — construction plus whatever it does not defer",
} as const satisfies ScenarioDescriptor;

/**
 * An empty child of a warm parent: a per-request container's whole allocation.
 */
export const CREATE_CHILD_EMPTY = {
  id: "create-child-empty",
  tier: "contract",
  requires: ["child-container"],
  facets: ["scope"],
  group: "boot",
  what: "create a child of a warm parent with nothing bound — a per-request container's whole allocation",
} as const satisfies ScenarioDescriptor;

/**
 * Registration alone: a fresh container, many factory bindings, no resolve.
 *
 * @remarks Every cold row bundles construction, binding and a resolve; this one prices the bind so
 * the cold graph row's first resolve becomes subtractable.
 */
export const BIND_128_PLAIN = {
  id: `bind-${String(BIND_TOKEN_COUNT)}-plain`,
  tier: "contract",
  requires: [],
  group: "boot",
  what: `bind ${String(BIND_TOKEN_COUNT)} transient factory tokens into a fresh container, no resolve — registration only`,
} as const satisfies ScenarioDescriptor;

/**
 * The same registrations refined after the fact with a name and a singleton scope.
 */
export const BIND_128_REFINED = {
  id: `bind-${String(BIND_TOKEN_COUNT)}-refined`,
  tier: "contract",
  requires: ["name-hint"],
  group: "boot",
  what: `the same ${String(BIND_TOKEN_COUNT)} bound, then each refined after registration with a name and a singleton scope`,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const MODULE_LOAD_UNLOAD = {
  id: "module-load-unload",
  tier: "contract",
  requires: ["module", "module-unload"],
  group: "boot",
  what: "container.load(2 modules) → resolve root → container.unload() per iteration",
} as const satisfies ScenarioDescriptor;

/**
 * Building a fresh container from two modules and resolving the root, per iteration.
 */
export const MODULE_COLD_FROM_MODULES = {
  id: "module-cold-from-modules",
  tier: "contract",
  requires: ["module"],
  group: "boot",
  what: "build a fresh container from 2 modules and resolve the root service (cold start)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE = {
  id: "boot-decorated-container-build-and-resolve",
  tier: "contract",
  requires: ["decorators"],
  group: "boot",
  what: "create container, bind decorated graph, resolve root once",
} as const satisfies ScenarioDescriptor;

// ── production ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const HTTP_HANDLER_BATCH = 50;
/**
 * @since 0.5.0-canary.7
 */
export const UOW_BATCH = 100;
/**
 * @since 0.5.0-canary.7
 */
export const EVENT_HANDLER_COUNT = 8;
/**
 * @since 0.5.0-canary.7
 */
export const EVENT_DISPATCH_BATCH = 100;

/**
 * @since 0.5.0-canary.7
 */
export const PRODUCTION_HTTP_HANDLER = {
  id: "production-http-handler",
  tier: "contract",
  requires: ["child-container", "dispose"],
  group: "production",
  what: "per-request child container: trace ID + auth context + handler resolve then dispose",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const PRODUCTION_UNIT_OF_WORK = {
  id: "production-unit-of-work",
  tier: "contract",
  requires: ["child-container", "dispose"],
  group: "production",
  what: "per-operation child container: UoW + Repository + Service resolve, commit, then dispose",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const PRODUCTION_EVENT_BUS_DISPATCH = {
  id: "production-event-bus-dispatch",
  tier: "contract",
  requires: ["resolve-all"],
  group: "production",
  what: `resolveAll() ${String(EVENT_HANDLER_COUNT)} singleton event handlers then dispatch event to each`,
} as const satisfies ScenarioDescriptor;

// ── registry-ops ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const REBIND_BATCH = 50;
/**
 * @since 0.5.0-canary.7
 */
export const HAS_BOUND_BATCH = 1000;
/**
 * @since 0.5.0-canary.7
 */
export const HAS_OWN_BATCH = 1000;
/**
 * @since 0.5.0-canary.7
 */
export const ACTIVATION_HOOK_BATCH = 200;
/**
 * @since 0.5.0-canary.7
 */
export const SCOPED_PER_CHILD_BATCH = 100;

/**
 * @since 0.5.0-canary.7
 */
export const REBIND_HOT_SWAP = {
  id: "rebind-hot-swap",
  tier: "contract",
  requires: ["rebind"],
  group: "lifecycle",
  what: "rebind(token).toConstantValue() replacing an existing binding then resolve once",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const HAS_BOUND_CHECK = {
  id: "has-bound-check",
  tier: "contract",
  requires: ["has"],
  group: "introspection",
  what: "container.has(token) returning true — registry lookup hot path for optional-dep guards",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const HAS_OWN_UNBOUND_CHECK = {
  id: "has-own-unbound-check",
  tier: "contract",
  requires: ["child-container", "has-own"],
  group: "introspection",
  what: "container.hasOwn(token) returning false — binding lives in parent, not own registry",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const CONTAINER_LEVEL_ACTIVATION_HOOK = {
  id: "container-level-activation-hook",
  tier: "contract",
  requires: ["activation-hook"],
  facets: ["hook"],
  group: "lifecycle",
  what: "resolve transient through a container.onActivation() hook — measures hook dispatch overhead",
} as const satisfies ScenarioDescriptor;

/**
 * The binding-level counterpart of `CONTAINER_LEVEL_ACTIVATION_HOOK`.
 *
 * @remarks
 * Shares `ACTIVATION_HOOK_BATCH` with the container-level row on purpose: the pair is only
 * readable side by side if the two dispatch lanes are measured at the same workload factor.
 *
 * @since 0.6.0
 */
export const BINDING_LEVEL_ACTIVATION_HOOK = {
  id: "binding-level-activation-hook",
  tier: "contract",
  requires: ["binding-activation-hook"],
  facets: ["hook"],
  group: "lifecycle",
  what: "resolve transient through a per-binding .onActivation() hook — measures hook dispatch overhead",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SCOPED_BINDING_PER_CHILD = {
  id: "scoped-binding-per-child",
  tier: "contract",
  requires: ["child-container", "scoped"],
  facets: ["scope"],
  group: "scope",
  what: "resolve .scoped() binding from a fresh child container each iteration — fresh instance per child",
} as const satisfies ScenarioDescriptor;

// ── resolution-patterns ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const OPTIONAL_HIT_BATCH = 500;
/**
 * @since 0.5.0-canary.7
 */
export const OPTIONAL_MISS_BATCH = 500;
/**
 * @since 0.5.0-canary.7
 */
export const TAGGED_RESOLVE_BATCH = 300;
/**
 * @since 0.5.0-canary.7
 */
export const TAGGED_ENVS = ["dev", "staging", "prod", "canary"] as const;
/**
 * @since 0.5.0-canary.7
 */
export const TARGET_TAG_VALUE = "prod";

/**
 * @since 0.5.0-canary.7
 */
export const RESOLVE_OPTIONAL_HIT = {
  id: "resolve-optional-hit",
  tier: "contract",
  requires: ["optional"],
  facets: ["optional"],
  group: "micro",
  what: "resolveOptional() when the binding exists — returns the value without throwing",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const RESOLVE_OPTIONAL_MISS = {
  id: "resolve-optional-miss",
  tier: "contract",
  requires: ["optional"],
  facets: ["optional"],
  group: "micro",
  what: "resolveOptional() when no binding exists — returns undefined without throwing",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const TAGGED_BINDING_RESOLVE = {
  id: "tagged-binding-resolve",
  tier: "contract",
  requires: ["tag-hint"],
  facets: ["tag"],
  group: "micro",
  what: `resolve(token, { tags: [["env","${TARGET_TAG_VALUE}"]] }) from ${String(TAGGED_ENVS.length)}-variant tagged set`,
} as const satisfies ScenarioDescriptor;

/**
 * The per-iteration op count for the conditional-injection row.
 */
export const CONDITIONAL_INJECTION_BATCH = 300;

/**
 * Resolving a transient consumer whose own tag selects one binding out of the tagged set.
 */
export const CONDITIONAL_INJECTION_TAGGED = {
  id: "conditional-injection-tagged",
  tier: "contract",
  requires: ["tagged-injection"],
  facets: ["tag"],
  group: "micro",
  what: `resolve a transient consumer injected with the tag-selected binding (1 of ${String(TAGGED_ENVS.length)})`,
} as const satisfies ScenarioDescriptor;

// ── binding-variants ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const TO_RESOLVED_BATCH = 200;
/**
 * @since 0.5.0-canary.7
 */
export const TO_ALIAS_BATCH = 500;
/**
 * @since 0.5.0-canary.7
 */
export const TO_SELF_BATCH = 300;

/**
 * @since 0.5.0-canary.7
 */
export const TO_RESOLVED_3_DEPS = {
  id: "to-resolved-3-deps",
  tier: "contract",
  requires: ["explicit-deps"],
  group: "micro",
  what: "resolve singleton bound via toResolved() with 3 explicit dep tokens (cache hit)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const TO_ALIAS_REDIRECT = {
  id: "to-alias-redirect",
  tier: "contract",
  requires: ["alias"],
  facets: ["alias"],
  group: "micro",
  what: "resolve a toAlias() binding that redirects to a cached singleton (alias chain hit)",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const TO_SELF_BINDING = {
  id: "to-self-binding",
  tier: "contract",
  requires: ["self-binding"],
  group: "micro",
  what: "resolve singleton bound via toSelf() — class constructor is the token (cache hit)",
} as const satisfies ScenarioDescriptor;

// ── failure ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export const MISCONFIGURED_MISSING_BINDING = {
  id: "misconfigured-missing-binding",
  tier: "contract",
  requires: [],
  group: "failure",
  what: "resolve a missing binding and fail fast",
} as const satisfies ScenarioDescriptor;

/**
 * The 3-node circular-dependency failure row.
 *
 * @remarks
 * Excluded from aggregates: the sides do incomparable work per op — codefast throws on the third
 * factory entry while inversify re-enters the user factory hundreds of times before its own error.
 *
 * @since 0.5.0-canary.7
 */
export const CIRCULAR_DEPENDENCY_3 = {
  id: "circular-dependency-3",
  tier: "contract",
  requires: ["cycle-detection"],
  group: "failure",
  what: "resolve a 3-node circular dependency and fail fast (row only — sides do incomparable work)",
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const AMBIGUOUS_MULTI_BINDING = {
  id: "ambiguous-multi-binding",
  tier: "contract",
  requires: ["ambiguity-error"],
  group: "failure",
  what: "resolve a single service from ambiguous multi-bindings and fail fast",
} as const satisfies ScenarioDescriptor;
