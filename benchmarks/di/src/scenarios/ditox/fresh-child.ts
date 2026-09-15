/**
 * Ditox — the default lane measured from a fresh per-request child. Parallel to
 * `../codefast/fresh-child.ts`: the parent owns the binding, the child owns nothing, and the row
 * pays createContainer(parent), N resolves and removeAll() per request.
 */
import { createContainer, token } from "ditox";

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

const SERVICE = token<ChildService>("bench-ditox-fresh-child-default");

function buildFreshChildScenario(resolvesPerChild: number): BenchScenario {
  const parent = createContainer();
  parent.bindValue(SERVICE, { env: TARGET_TAG_VALUE });

  function runOneRequest(): ChildService {
    const child = createContainer(parent);
    let resolved = child.resolve(SERVICE);
    for (let index = 1; index < resolvesPerChild; index++) {
      resolved = child.resolve(SERVICE);
    }
    child.removeAll();
    return resolved;
  }

  runOneRequest();

  return {
    ...freshChildDescriptor("default", resolvesPerChild),
    what: `resolve(token) ${String(resolvesPerChild)}× inside a per-request createContainer(parent), then removeAll() — the child's per-request cost at duty cycle ${String(resolvesPerChild)}`,
    batch: FRESH_CHILD_BATCH,
    sanity: () => runOneRequest().env === TARGET_TAG_VALUE,
    build: () =>
      batched(FRESH_CHILD_BATCH, () => {
        runOneRequest();
      }),
  };
}

/**
 * Builds ditox's fresh-child scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxFreshChildScenarios(): ReadonlyArray<BenchScenario> {
  return FRESH_CHILD_RESOLVES.map((count) => buildFreshChildScenario(count));
}
