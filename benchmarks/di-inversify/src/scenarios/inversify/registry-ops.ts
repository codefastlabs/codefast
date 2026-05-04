/**
 * InversifyJS 8 — registry operation scenarios. Parallel to
 * {@link ../codefast/registry-ops.ts}.
 *
 * Inversify mapping:
 *   - `container.rebind(token)` → `container.rebind(id)` (sync, same semantics)
 *   - `container.has(token)` → `container.isBound(id)` (checks parent chain)
 *   - `container.hasOwn(token)` → `container.isCurrentBound(id)` (own only)
 *   - `container.onActivation(token, fn)` → `container.onActivation(id, fn)`
 *   - `.scoped()` → `.inRequestScope()` (singleton per child container)
 */
import "reflect-metadata";
import { Container } from "inversify";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: rebind hot-swap ─────────────────────────────────────────────

const REBIND_BATCH = 50;

const rebindId = Symbol("bench-inv-ro-rebind");

function buildRebindHotSwapScenario(): BenchScenario {
  const container = new Container();
  container.bind<number>(rebindId).toConstantValue(1);

  function runOneSwap(iteration: number): number {
    container.rebind<number>(rebindId).toConstantValue(iteration);
    return container.get<number>(rebindId);
  }

  // Pre-warm
  runOneSwap(0);

  return {
    id: "rebind-hot-swap",
    group: "lifecycle",
    what: "rebind(id).toConstantValue() replacing an existing binding then get once",
    batch: REBIND_BATCH,
    sanity: () => {
      const result = runOneSwap(99);
      return result === 99;
    },
    build: () => {
      let iteration = 0;
      return batched(REBIND_BATCH, () => {
        runOneSwap(iteration++);
      });
    },
  };
}

// ─── scenario 2: isBound — bound identifier ──────────────────────────────────

const HAS_BOUND_BATCH = 1000;

const hasBoundId = Symbol("bench-inv-ro-has-bound");

function buildIsBoundCheckScenario(): BenchScenario {
  const container = new Container();
  container.bind<number>(hasBoundId).toConstantValue(1);
  container.isBound(hasBoundId);

  return {
    id: "has-bound-check",
    group: "introspection",
    what: "container.isBound(id) returning true — registry lookup hot path for optional-dep guards",
    batch: HAS_BOUND_BATCH,
    sanity: () => container.isBound(hasBoundId) === true,
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.isBound(hasBoundId);
      }),
  };
}

// ─── scenario 3: isCurrentBound — unbound in child ───────────────────────────

const HAS_OWN_BATCH = 1000;

const hasOwnId = Symbol("bench-inv-ro-has-own");

function buildIsCurrentBoundCheckScenario(): BenchScenario {
  const parentContainer = new Container();
  parentContainer.bind<number>(hasOwnId).toConstantValue(42);
  const childContainer = new Container({ parent: parentContainer });
  // The binding is in parent, not child — isCurrentBound returns false
  childContainer.isCurrentBound(hasOwnId);

  return {
    id: "has-own-unbound-check",
    group: "introspection",
    what: "container.isCurrentBound(id) returning false — binding lives in parent, not own registry",
    batch: HAS_OWN_BATCH,
    sanity: () =>
      childContainer.isCurrentBound(hasOwnId) === false &&
      childContainer.isBound(hasOwnId) === true,
    build: () =>
      batched(HAS_OWN_BATCH, () => {
        childContainer.isCurrentBound(hasOwnId);
      }),
  };
}

// ─── scenario 4: container-level onActivation hook ───────────────────────────

const ACTIVATION_HOOK_BATCH = 200;

interface HookPayload {
  value: number;
  activated: boolean;
}

const hookPayloadId = Symbol("bench-inv-ro-hook-payload");

function buildContainerLevelActivationHookScenario(): BenchScenario {
  const container = new Container();
  let activationCallCount = 0;

  container
    .bind<HookPayload>(hookPayloadId)
    .toDynamicValue(() => ({ value: 1, activated: false }))
    .inTransientScope();

  // Register a container-level activation hook — fires on every transient resolve
  container.onActivation<HookPayload>(hookPayloadId, (_ctx, instance) => {
    activationCallCount += 1;
    instance.activated = true;
    return instance;
  });

  // Pre-warm
  container.get<HookPayload>(hookPayloadId);

  return {
    id: "container-level-activation-hook",
    group: "lifecycle",
    what: "get() transient through a container.onActivation() hook — measures hook dispatch overhead",
    batch: ACTIVATION_HOOK_BATCH,
    sanity: () => {
      const before = activationCallCount;
      const result = container.get<HookPayload>(hookPayloadId);
      return result.activated && activationCallCount === before + 1;
    },
    build: () =>
      batched(ACTIVATION_HOOK_BATCH, () => {
        container.get(hookPayloadId);
      }),
  };
}

// ─── scenario 5: inRequestScope — shared within one resolution call ────────────
//
// inversify's `inRequestScope()` scopes to a single `get()` call tree, not to a
// child container.  To exercise this properly: a root service depends on the scoped
// token through two different intermediate services.  Both intermediates share the
// same scoped instance within one `get(rootId)` call; the next call creates a fresh one.

const SCOPED_PER_CHILD_BATCH = 100;

interface ScopedInstance {
  readonly id: number;
}
interface ScopedBranchA {
  readonly scoped: ScopedInstance;
}
interface ScopedBranchB {
  readonly scoped: ScopedInstance;
}
interface ScopedRoot {
  readonly a: ScopedBranchA;
  readonly b: ScopedBranchB;
}

const scopedId = Symbol("bench-inv-ro-scoped");
const scopedBranchAId = Symbol("bench-inv-ro-scoped-branch-a");
const scopedBranchBId = Symbol("bench-inv-ro-scoped-branch-b");
const scopedRootId = Symbol("bench-inv-ro-scoped-root");

function buildScopedBindingPerChildScenario(): BenchScenario {
  const container = new Container();
  let instanceCounter = 0;

  container
    .bind<ScopedInstance>(scopedId)
    .toDynamicValue(() => ({ id: ++instanceCounter }))
    .inRequestScope();

  container
    .bind<ScopedBranchA>(scopedBranchAId)
    .toDynamicValue((ctx) => ({ scoped: ctx.get<ScopedInstance>(scopedId) }))
    .inTransientScope();

  container
    .bind<ScopedBranchB>(scopedBranchBId)
    .toDynamicValue((ctx) => ({ scoped: ctx.get<ScopedInstance>(scopedId) }))
    .inTransientScope();

  container
    .bind<ScopedRoot>(scopedRootId)
    .toDynamicValue((ctx) => ({
      a: ctx.get<ScopedBranchA>(scopedBranchAId),
      b: ctx.get<ScopedBranchB>(scopedBranchBId),
    }))
    .inTransientScope();

  // Pre-warm
  container.get<ScopedRoot>(scopedRootId);

  return {
    id: "scoped-binding-per-child",
    group: "scope",
    what: "inRequestScope() shared within one get() call tree; fresh instance on next get() call",
    batch: SCOPED_PER_CHILD_BATCH,
    sanity: () => {
      const r1 = container.get<ScopedRoot>(scopedRootId);
      const r2 = container.get<ScopedRoot>(scopedRootId);
      // Within one call: both branches share the same scoped instance
      // Across calls: each call creates a fresh scoped instance
      return r1.a.scoped === r1.b.scoped && r1.a.scoped !== r2.a.scoped;
    },
    build: () =>
      batched(SCOPED_PER_CHILD_BATCH, () => {
        container.get(scopedRootId);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyRegistryOpsScenarios(): readonly BenchScenario[] {
  return [
    buildRebindHotSwapScenario(),
    buildIsBoundCheckScenario(),
    buildIsCurrentBoundCheckScenario(),
    buildContainerLevelActivationHookScenario(),
    buildScopedBindingPerChildScenario(),
  ];
}
