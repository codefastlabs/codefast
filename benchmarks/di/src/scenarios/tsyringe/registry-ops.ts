/**
 * tsyringe — registry operation scenarios: a container-level `afterResolution` interceptor on a
 * transient token, `isRegistered()` through the parent chain, and `isRegistered()` on the child alone.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import {
  ACTIVATION_HOOK_BATCH,
  CONTAINER_LEVEL_ACTIVATION_HOOK,
  HAS_BOUND_BATCH,
  HAS_BOUND_CHECK,
  HAS_OWN_BATCH,
  HAS_OWN_UNBOUND_CHECK,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface HookPayload {
  value: number;
  activated: boolean;
}

const hookPayloadToken = Symbol("bench-tsyringe-ro-hook-payload");

function buildContainerLevelActivationHookScenario(): BenchScenario {
  const container = tsyringeRootContainer.createChildContainer();
  let activationCallCount = 0;
  container.register<HookPayload>(hookPayloadToken, { useFactory: () => ({ value: 1, activated: false }) });
  container.afterResolution<HookPayload>(
    hookPayloadToken,
    (_token, result) => {
      activationCallCount += 1;
      for (const instance of Array.isArray(result) ? result : [result]) {
        instance.activated = true;
      }
    },
    { frequency: "Always" },
  );
  container.resolve<HookPayload>(hookPayloadToken);

  return {
    ...CONTAINER_LEVEL_ACTIVATION_HOOK,
    what: "resolve a transient factory provider through a container afterResolution() interceptor — measures hook dispatch overhead",
    batch: ACTIVATION_HOOK_BATCH,
    sanity: () => {
      const before = activationCallCount;
      const result = container.resolve<HookPayload>(hookPayloadToken);
      return result.activated && activationCallCount === before + 1;
    },
    build: () =>
      batched(ACTIVATION_HOOK_BATCH, () => {
        container.resolve<HookPayload>(hookPayloadToken);
      }),
  };
}

const hasBoundToken = Symbol("bench-tsyringe-ro-has-bound");
const hasOwnToken = Symbol("bench-tsyringe-ro-has-own");

function buildHasBoundCheckScenario(): BenchScenario {
  const container = tsyringeRootContainer.createChildContainer();
  container.register<number>(hasBoundToken, { useValue: 1 });
  container.isRegistered(hasBoundToken, true);

  return {
    ...HAS_BOUND_CHECK,
    what: "isRegistered(token, true) returning true — registry lookup hot path for optional-dep guards",
    batch: HAS_BOUND_BATCH,
    sanity: () => container.isRegistered(hasBoundToken, true),
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.isRegistered(hasBoundToken, true);
      }),
  };
}

function buildHasOwnUnboundCheckScenario(): BenchScenario {
  const parent = tsyringeRootContainer.createChildContainer();
  parent.register<number>(hasOwnToken, { useValue: 42 });
  const child = parent.createChildContainer();
  child.isRegistered(hasOwnToken);

  return {
    ...HAS_OWN_UNBOUND_CHECK,
    what: "isRegistered(token) without recursion returning false — the registration lives in the parent",
    batch: HAS_OWN_BATCH,
    sanity: () => !child.isRegistered(hasOwnToken) && child.isRegistered(hasOwnToken, true),
    build: () =>
      batched(HAS_OWN_BATCH, () => {
        child.isRegistered(hasOwnToken);
      }),
  };
}

/**
 * Builds tsyringe's registry operation scenarios.
 */
export function buildTsyringeRegistryOpsScenarios(): ReadonlyArray<BenchScenario> {
  return [buildContainerLevelActivationHookScenario(), buildHasBoundCheckScenario(), buildHasOwnUnboundCheckScenario()];
}
