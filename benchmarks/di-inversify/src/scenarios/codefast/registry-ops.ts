/**
 * @codefast/di — registry operation scenarios.
 *
 * Exercises container mutation and introspection APIs not covered elsewhere:
 *
 *   - `rebind-hot-swap` — `container.rebind(token).toConstantValue(v)` replaces
 *     an existing binding and re-resolves.  Models runtime reconfiguration (feature
 *     toggle, test setup).  Each iteration: rebind + resolve + rebind back.
 *
 *   - `has-bound-check` — `container.has(token)` returning true.  Measures the
 *     registry lookup hot path used by optional-dep guard patterns.
 *
 *   - `has-own-unbound-check` — `container.hasOwn(token)` returning false on a
 *     child container when the binding lives in the parent.  Exercises the "own
 *     only, no parent walk" code path.
 *
 *   - `container-level-activation-hook` — `container.onActivation(token, fn)`
 *     adds a per-token hook at container level.  Resolving a transient binding
 *     through that token fires the hook on every call.  Measures the extra
 *     dispatch cost vs. a plain transient resolve.
 *
 *   - `scoped-binding-per-child` — `.scoped()` binding is a singleton within one
 *     child container but a fresh instance in each new child.  Each iteration
 *     creates a child, resolves the scoped token (fresh instance), and disposes
 *     the child.  Measures the scoped allocation + child lifecycle cost.
 */
import { Container, token } from "@codefast/di";

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

const rebindToken = token<number>("bench-cf-ro-rebind");

function buildRebindHotSwapScenario(): BenchScenario {
  const container = Container.create();
  container.bind(rebindToken).toConstantValue(1);

  function runOneSwap(iteration: number): number {
    container.rebind(rebindToken).toConstantValue(iteration);
    return container.resolve(rebindToken);
  }

  // Pre-warm
  runOneSwap(0);

  return {
    ...REBIND_HOT_SWAP,
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

// ─── scenario 2: has — bound token ───────────────────────────────────────────

const hasBoundToken = token<number>("bench-cf-ro-has-bound");

function buildHasBoundCheckScenario(): BenchScenario {
  const container = Container.create();
  container.bind(hasBoundToken).toConstantValue(1);
  container.has(hasBoundToken);

  return {
    ...HAS_BOUND_CHECK,
    batch: HAS_BOUND_BATCH,
    sanity: () => container.has(hasBoundToken),
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.has(hasBoundToken);
      }),
  };
}

// ─── scenario 3: hasOwn — unbound in child ────────────────────────────────────

const hasOwnToken = token<number>("bench-cf-ro-has-own");

function buildHasOwnUnboundCheckScenario(): BenchScenario {
  const parentContainer = Container.create();
  parentContainer.bind(hasOwnToken).toConstantValue(42);
  const childContainer = parentContainer.createChild();
  // The binding is in parent, not in child — hasOwn returns false
  childContainer.hasOwn(hasOwnToken);

  return {
    ...HAS_OWN_UNBOUND_CHECK,
    batch: HAS_OWN_BATCH,
    sanity: () => !childContainer.hasOwn(hasOwnToken) && childContainer.has(hasOwnToken),
    build: () =>
      batched(HAS_OWN_BATCH, () => {
        childContainer.hasOwn(hasOwnToken);
      }),
  };
}

// ─── scenario 4: container-level onActivation hook ───────────────────────────

interface HookPayload {
  value: number;
  activated: boolean;
}

const hookPayloadToken = token<HookPayload>("bench-cf-ro-hook-payload");

function buildContainerLevelActivationHookScenario(): BenchScenario {
  const container = Container.create();
  let activationCallCount = 0;

  container
    .bind(hookPayloadToken)
    .toDynamic(() => ({ value: 1, activated: false }))
    .transient();

  // Register a container-level activation hook — fires on every transient resolve
  container.onActivation(hookPayloadToken, (_ctx, instance) => {
    activationCallCount += 1;
    instance.activated = true;
    return instance;
  });

  // Pre-warm
  container.resolve(hookPayloadToken);

  return {
    ...CONTAINER_LEVEL_ACTIVATION_HOOK,
    batch: ACTIVATION_HOOK_BATCH,
    sanity: () => {
      const before = activationCallCount;
      const result = container.resolve(hookPayloadToken);
      return result.activated && activationCallCount === before + 1;
    },
    build: () =>
      batched(ACTIVATION_HOOK_BATCH, () => {
        container.resolve(hookPayloadToken);
      }),
  };
}

// ─── scenario 5: scoped binding per child ─────────────────────────────────────

interface ScopedInstance {
  readonly id: number;
}

const scopedToken = token<ScopedInstance>("bench-cf-ro-scoped");

function buildScopedBindingPerChildScenario(): BenchScenario {
  const appContainer = Container.create();
  let instanceCounter = 0;

  appContainer
    .bind(scopedToken)
    .toDynamic(() => ({ id: ++instanceCounter }))
    .scoped();

  function runOneScopedRequest(): ScopedInstance {
    const child = appContainer.createChild();
    const first = child.resolve(scopedToken);
    const second = child.resolve(scopedToken); // same child → same instance
    if (first !== second) {
      throw new Error("Expected scoped binding to return same instance within child");
    }
    child.unbindAll();
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
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
export function buildCodefastRegistryOpsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildRebindHotSwapScenario(),
    buildHasBoundCheckScenario(),
    buildHasOwnUnboundCheckScenario(),
    buildContainerLevelActivationHookScenario(),
    buildScopedBindingPerChildScenario(),
  ];
}
