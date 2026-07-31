/**
 * InversifyJS 8 — registry operation scenarios. Parallel to
 * {@link ../codefast/registry-ops.ts}.
 *
 * Inversify mapping:
 *   - `container.rebind(token)` → `container.rebind(id)` (sync, same semantics)
 *   - `container.has(token)` → `container.isBound(id)` (checks parent chain)
 *   - `container.hasOwn(token)` → `container.isCurrentBound(id)` (own only)
 *   - `container.onActivation(token, fn)` → `container.onActivation(id, fn)`
 *   - `.scoped()` → per-request child container + own singleton bind (see scenario 5)
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  ACTIVATION_HOOK_BATCH,
  CONTAINER_LEVEL_ACTIVATION_HOOK,
  HAS_BOUND_BATCH,
  HAS_BOUND_CHECK,
  HAS_OWN_BATCH,
  HAS_OWN_UNBOUND_CHECK,
  REBIND_BATCH,
  REBIND_HOT_SWAP,
  SCOPED_BINDING_PER_CHILD,
  SCOPED_PER_CHILD_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: rebind hot-swap ─────────────────────────────────────────────

const rebindId = Symbol("bench-inv-ro-rebind");

function buildRebindHotSwapScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<number>(rebindId).toConstantValue(1);

  function runOneSwap(iteration: number): number {
    container.rebind<number>(rebindId).toConstantValue(iteration);
    return container.get<number>(rebindId);
  }

  // Pre-warm
  runOneSwap(0);

  return {
    ...REBIND_HOT_SWAP,
    // inversify-specific wording — the shared descriptor supplies the paired id/group
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

const hasBoundId = Symbol("bench-inv-ro-has-bound");

function buildIsBoundCheckScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<number>(hasBoundId).toConstantValue(1);
  container.isBound(hasBoundId);

  return {
    ...HAS_BOUND_CHECK,
    what: "container.isBound(id) returning true — registry lookup hot path for optional-dep guards",
    batch: HAS_BOUND_BATCH,
    sanity: () => container.isBound(hasBoundId),
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.isBound(hasBoundId);
      }),
  };
}

// ─── scenario 3: isCurrentBound — unbound in child ───────────────────────────

const hasOwnId = Symbol("bench-inv-ro-has-own");

function buildIsCurrentBoundCheckScenario(): BenchScenario {
  const parentContainer = new Container({ jitless: false });
  parentContainer.bind<number>(hasOwnId).toConstantValue(42);
  const childContainer = new Container({ jitless: false, parent: parentContainer });
  // The binding is in parent, not child — isCurrentBound returns false
  childContainer.isCurrentBound(hasOwnId);

  return {
    ...HAS_OWN_UNBOUND_CHECK,
    what: "container.isCurrentBound(id) returning false — binding lives in parent, not own registry",
    batch: HAS_OWN_BATCH,
    sanity: () => !childContainer.isCurrentBound(hasOwnId) && childContainer.isBound(hasOwnId),
    build: () =>
      batched(HAS_OWN_BATCH, () => {
        childContainer.isCurrentBound(hasOwnId);
      }),
  };
}

// ─── scenario 4: container-level onActivation hook ───────────────────────────

interface HookPayload {
  value: number;
  activated: boolean;
}

const hookPayloadId = Symbol("bench-inv-ro-hook-payload");

function buildContainerLevelActivationHookScenario(): BenchScenario {
  const container = new Container({ jitless: false });
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
    ...CONTAINER_LEVEL_ACTIVATION_HOOK,
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

// ─── scenario 5: per-request child sharing ────────────────────────────────────
//
// inversify 8 has no per-child binding scope (`inRequestScope()` spans a single
// `get()` call tree), so per-request sharing across several resolves is expressed
// as a per-request child container carrying its own singleton bind. Same user
// story as the codefast side, idiomatic to each library.

interface ScopedInstance {
  readonly id: number;
}

const scopedId = Symbol("bench-inv-ro-scoped");

function buildScopedBindingPerChildScenario(): BenchScenario {
  const appContainer = new Container({ jitless: false });
  let instanceCounter = 0;

  function runOneScopedRequest(): ScopedInstance {
    const child = new Container({ jitless: false, parent: appContainer });
    child
      .bind<ScopedInstance>(scopedId)
      .toDynamicValue(() => ({ id: ++instanceCounter }))
      .inSingletonScope();
    const first = child.get<ScopedInstance>(scopedId);
    const second = child.get<ScopedInstance>(scopedId);
    if (first !== second) {
      throw new Error("Expected per-child singleton to return same instance within child");
    }
    child.unbindAll();
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "per-request child container with its own singleton bind — inversify's idiom for per-request sharing (one bind per iteration)",
    batch: SCOPED_PER_CHILD_BATCH,
    sanity: () => {
      const r1 = runOneScopedRequest();
      const r2 = runOneScopedRequest();
      return r1 !== r2 && r1.id < r2.id;
    },
    build: () =>
      batched(SCOPED_PER_CHILD_BATCH, () => {
        runOneScopedRequest();
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyRegistryOpsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildRebindHotSwapScenario(),
    buildIsBoundCheckScenario(),
    buildIsCurrentBoundCheckScenario(),
    buildContainerLevelActivationHookScenario(),
    buildScopedBindingPerChildScenario(),
  ];
}
