/**
 * tsyringe — the default lane measured from a fresh per-request child. Parallel to
 * `../codefast/fresh-child.ts`: the app container owns the registration, the child owns nothing, and
 * the row pays createChildContainer(), N resolves and dispose() per request.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import {
  FRESH_CHILD_BATCH,
  FRESH_CHILD_RESOLVES,
  freshChildDescriptor,
  TARGET_TAG_VALUE,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ChildService {
  readonly env: string;
}

const serviceToken = Symbol("bench-tsyringe-fresh-child-default");

function buildFreshChildScenario(resolvesPerChild: number): BenchScenario {
  const parent = tsyringeRootContainer.createChildContainer();
  parent.register<ChildService>(serviceToken, { useValue: { env: TARGET_TAG_VALUE } });

  function runOneRequest(): ChildService {
    const child = parent.createChildContainer();
    let resolved = child.resolve<ChildService>(serviceToken);
    for (let index = 1; index < resolvesPerChild; index++) {
      resolved = child.resolve<ChildService>(serviceToken);
    }
    void child.dispose();
    return resolved;
  }

  runOneRequest();

  return {
    ...freshChildDescriptor("default", resolvesPerChild),
    what: `resolve(token) ${String(resolvesPerChild)}× inside a per-request createChildContainer(), then dispose() — the child's per-request cost at duty cycle ${String(resolvesPerChild)}`,
    batch: FRESH_CHILD_BATCH,
    sanity: () => !parent.createChildContainer().isRegistered(serviceToken) && runOneRequest().env === TARGET_TAG_VALUE,
    build: () =>
      batched(FRESH_CHILD_BATCH, () => {
        runOneRequest();
      }),
  };
}

/**
 * Builds tsyringe's fresh-child scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeFreshChildScenarios(): ReadonlyArray<BenchScenario> {
  return FRESH_CHILD_RESOLVES.map((count) => buildFreshChildScenario(count));
}
