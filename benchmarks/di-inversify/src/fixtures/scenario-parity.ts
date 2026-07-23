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

type ScenarioDescriptor = Pick<BenchScenario, "id" | "group" | "what">;

// ─── micro ───────────────────────────────────────────────────────────────────

export const CONSTANT_RESOLVE_BATCH = 1000;
export const CLASS_RESOLVE_BATCH = 200;
export const NAMED_RESOLVE_BATCH = 500;

export const CONSTANT_RESOLVE = {
  id: "constant-resolve",
  group: "micro",
  what: "resolve a toConstantValue binding",
} as const satisfies ScenarioDescriptor;

export const SINGLETON_CLASS_1_DEP = {
  id: "singleton-class-1-dep",
  group: "micro",
  what: "resolve a singleton class with one dependency (cache hit)",
} as const satisfies ScenarioDescriptor;

export const TRANSIENT_CLASS_1_DEP = {
  id: "transient-class-1-dep",
  group: "micro",
  what: "resolve a transient class with one transient dep (fresh each call)",
} as const satisfies ScenarioDescriptor;

export const NAMED_CONSTANT_GET = {
  id: "named-constant-get",
  group: "micro",
  what: "resolve a named constant from a 3-candidate set",
} as const satisfies ScenarioDescriptor;

// ─── realistic ───────────────────────────────────────────────────────────────

export const REALISTIC_RESOLVE_BATCH = 20;

export const REALISTIC_GRAPH_RESOLVE_ROOT = {
  id: "realistic-graph-resolve-root",
  group: "realistic",
  what: "resolve the transient root of a 10-node graph (hot path, singletons cached)",
} as const satisfies ScenarioDescriptor;

export const REALISTIC_GRAPH_COLD_RESOLVE = {
  id: "realistic-graph-cold-resolve",
  group: "realistic",
  what: "build a fresh container, bind 10 nodes, resolve root once (cold start)",
} as const satisfies ScenarioDescriptor;

// ─── fan-out ─────────────────────────────────────────────────────────────────

export const FAN_OUT_TREE_BATCH = 20;

export const FAN_OUT_TREE = {
  id: "fan-out-tree-depth-3-breadth-4",
  group: "fan-out",
  what: "resolve transient tree (depth 3, breadth 4; 21 nodes total)",
} as const satisfies ScenarioDescriptor;

export function resolveAllStrategiesDescriptor(strategyCount: number): ScenarioDescriptor {
  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    group: "fan-out",
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
  };
}

export function resolveAllNamedDescriptor(namedCount: number): ScenarioDescriptor {
  return {
    id: `resolve-all-named-${String(namedCount)}`,
    group: "fan-out",
    what: `resolveAll() with name qualifier across ${String(namedCount)} named strategy bindings`,
  };
}

// ─── async ───────────────────────────────────────────────────────────────────

export const ASYNC_CHAIN_DEPTH = 8;
export const ASYNC_CONCURRENT_FANOUT_COUNTS = [8, 16, 32, 64] as const;

export const RESOLVE_ASYNC_SINGLE_HOP = {
  id: "resolve-async-single-hop",
  group: "async",
  what: "resolveAsync() one singleton async factory (warm path after first await)",
} as const satisfies ScenarioDescriptor;

export const DYNAMIC_ASYNC_CHAIN_8 = {
  id: "dynamic-async-chain-8",
  group: "async",
  what: "resolveAsync() through an 8-step transient async dynamic chain",
} as const satisfies ScenarioDescriptor;

export function asyncFanoutConcurrentDescriptor(concurrency: number): ScenarioDescriptor {
  return {
    id: `async-fanout-concurrent-${String(concurrency)}`,
    group: "async",
    what: `resolveAsync ${String(concurrency)} independent async dependencies in parallel via Promise.all (microtask-yield factories)`,
  };
}

// ─── lifecycle ───────────────────────────────────────────────────────────────

export const LIFECYCLE_POST_CONSTRUCT_BATCH = 250;

export const LIFECYCLE_POST_CONSTRUCT_SINGLETON = {
  id: "lifecycle-post-construct-singleton",
  group: "lifecycle",
  what: "resolve singleton class with @postConstruct already warmed",
} as const satisfies ScenarioDescriptor;

export const LIFECYCLE_PRE_DESTROY_UNBIND = {
  id: "lifecycle-pre-destroy-unbind",
  group: "lifecycle",
  what: "unbind singleton and run onDeactivation + @preDestroy lifecycle",
} as const satisfies ScenarioDescriptor;

// ─── scope ───────────────────────────────────────────────────────────────────

export const CHILD_RESOLVE_BATCH = 500;
export const REQUEST_LIFECYCLE_BATCH = 100;

export const CHILD_DEPTH_2_RESOLVE = {
  id: "child-depth-2-resolve",
  group: "scope",
  what: "resolve a parent binding from a depth-2 child (realistic per-request shape)",
} as const satisfies ScenarioDescriptor;

export const CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE = {
  id: "child-request-lifecycle-create-resolve-dispose",
  group: "scope",
  what: "create per-request child container, resolve from grandchild depth-2, then unbind/dispose",
} as const satisfies ScenarioDescriptor;

// ─── scale ───────────────────────────────────────────────────────────────────

export const SCALE_CHAIN_SIZE = 512;

export const SCALE_DEEP_TRANSIENT_CHAIN_512 = {
  id: "scale-deep-transient-chain-512",
  group: "scale",
  what: "resolve a 512-step transient chain (500+ binding registry pressure)",
} as const satisfies ScenarioDescriptor;

// ─── boot ────────────────────────────────────────────────────────────────────

export const MODULE_LOAD_UNLOAD = {
  id: "module-load-unload",
  group: "boot",
  what: "container.load(2 modules) → resolve root → container.unload() per iteration",
} as const satisfies ScenarioDescriptor;

export const BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE = {
  id: "boot-decorated-container-build-and-resolve",
  group: "boot",
  what: "create container, bind decorated graph, resolve root once",
} as const satisfies ScenarioDescriptor;

// ─── production ──────────────────────────────────────────────────────────────

export const HTTP_HANDLER_BATCH = 50;
export const UOW_BATCH = 100;
export const EVENT_HANDLER_COUNT = 8;
export const EVENT_DISPATCH_BATCH = 100;

export const PRODUCTION_HTTP_HANDLER = {
  id: "production-http-handler",
  group: "production",
  what: "per-request child container: trace ID + auth context + handler resolve then dispose",
} as const satisfies ScenarioDescriptor;

export const PRODUCTION_UNIT_OF_WORK = {
  id: "production-unit-of-work",
  group: "production",
  what: "per-operation child container: UoW + Repository + Service resolve, commit, then dispose",
} as const satisfies ScenarioDescriptor;

export const PRODUCTION_EVENT_BUS_DISPATCH = {
  id: "production-event-bus-dispatch",
  group: "production",
  what: `resolveAll() ${String(EVENT_HANDLER_COUNT)} singleton event handlers then dispatch event to each`,
} as const satisfies ScenarioDescriptor;

// ─── registry-ops ────────────────────────────────────────────────────────────

export const REBIND_BATCH = 50;
export const HAS_BOUND_BATCH = 1000;
export const HAS_OWN_BATCH = 1000;
export const ACTIVATION_HOOK_BATCH = 200;
export const SCOPED_PER_CHILD_BATCH = 100;

export const REBIND_HOT_SWAP = {
  id: "rebind-hot-swap",
  group: "lifecycle",
  what: "rebind(token).toConstantValue() replacing an existing binding then resolve once",
} as const satisfies ScenarioDescriptor;

export const HAS_BOUND_CHECK = {
  id: "has-bound-check",
  group: "introspection",
  what: "container.has(token) returning true — registry lookup hot path for optional-dep guards",
} as const satisfies ScenarioDescriptor;

export const HAS_OWN_UNBOUND_CHECK = {
  id: "has-own-unbound-check",
  group: "introspection",
  what: "container.hasOwn(token) returning false — binding lives in parent, not own registry",
} as const satisfies ScenarioDescriptor;

export const CONTAINER_LEVEL_ACTIVATION_HOOK = {
  id: "container-level-activation-hook",
  group: "lifecycle",
  what: "resolve transient through a container.onActivation() hook — measures hook dispatch overhead",
} as const satisfies ScenarioDescriptor;

export const SCOPED_BINDING_PER_CHILD = {
  id: "scoped-binding-per-child",
  group: "scope",
  what: "resolve .scoped() binding from a fresh child container each iteration — fresh instance per child",
} as const satisfies ScenarioDescriptor;

// ─── resolution-patterns ─────────────────────────────────────────────────────

export const OPTIONAL_HIT_BATCH = 500;
export const OPTIONAL_MISS_BATCH = 500;
export const TAGGED_RESOLVE_BATCH = 300;
export const TAGGED_ENVS = ["dev", "staging", "prod", "canary"] as const;
export const TARGET_TAG_VALUE = "prod";

export const RESOLVE_OPTIONAL_HIT = {
  id: "resolve-optional-hit",
  group: "micro",
  what: "resolveOptional() when the binding exists — returns the value without throwing",
} as const satisfies ScenarioDescriptor;

export const RESOLVE_OPTIONAL_MISS = {
  id: "resolve-optional-miss",
  group: "micro",
  what: "resolveOptional() when no binding exists — returns undefined without throwing",
} as const satisfies ScenarioDescriptor;

export const TAGGED_BINDING_RESOLVE = {
  id: "tagged-binding-resolve",
  group: "micro",
  what: `resolve(token, { tags: [["env","${TARGET_TAG_VALUE}"]] }) from ${String(TAGGED_ENVS.length)}-variant tagged set`,
} as const satisfies ScenarioDescriptor;

// ─── binding-variants ────────────────────────────────────────────────────────

export const TO_RESOLVED_BATCH = 200;
export const TO_ALIAS_BATCH = 500;
export const TO_SELF_BATCH = 300;

export const TO_RESOLVED_3_DEPS = {
  id: "to-resolved-3-deps",
  group: "micro",
  what: "resolve singleton bound via toResolved() with 3 explicit dep tokens (cache hit)",
} as const satisfies ScenarioDescriptor;

export const TO_ALIAS_REDIRECT = {
  id: "to-alias-redirect",
  group: "micro",
  what: "resolve a toAlias() binding that redirects to a cached singleton (alias chain hit)",
} as const satisfies ScenarioDescriptor;

export const TO_SELF_BINDING = {
  id: "to-self-binding",
  group: "micro",
  what: "resolve singleton bound via toSelf() — class constructor is the token (cache hit)",
} as const satisfies ScenarioDescriptor;

// ─── failure ─────────────────────────────────────────────────────────────────

export const MISCONFIGURED_MISSING_BINDING = {
  id: "misconfigured-missing-binding",
  group: "failure",
  what: "resolve a missing binding and fail fast",
} as const satisfies ScenarioDescriptor;

export const CIRCULAR_DEPENDENCY_3 = {
  id: "circular-dependency-3",
  group: "failure",
  what: "resolve a 3-node circular dependency and fail fast",
} as const satisfies ScenarioDescriptor;

export const AMBIGUOUS_MULTI_BINDING = {
  id: "ambiguous-multi-binding",
  group: "failure",
  what: "resolve a single service from ambiguous multi-bindings and fail fast",
} as const satisfies ScenarioDescriptor;
