/**
 * Awilix — the default lane measured from a fresh per-request scope. Parallel to
 * `../codefast/fresh-child.ts`: the root owns the registration, the scope owns nothing, and the row
 * pays createScope(), N resolves and dispose() per request.
 */
import { asValue, createContainer } from "awilix";

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

function buildFreshChildScenario(resolvesPerChild: number): BenchScenario {
  const root = createContainer();
  root.register({ service: asValue<ChildService>({ env: TARGET_TAG_VALUE }) });

  function runOneRequest(): ChildService {
    const scope = root.createScope();
    let resolved = scope.resolve<ChildService>("service");
    for (let index = 1; index < resolvesPerChild; index++) {
      resolved = scope.resolve<ChildService>("service");
    }
    void scope.dispose();
    return resolved;
  }

  runOneRequest();

  return {
    ...freshChildDescriptor("default", resolvesPerChild),
    what: `resolve(name) ${String(resolvesPerChild)}× inside a per-request createScope(), then dispose() — the scope's per-request cost at duty cycle ${String(resolvesPerChild)}`,
    batch: FRESH_CHILD_BATCH,
    sanity: () => runOneRequest().env === TARGET_TAG_VALUE,
    build: () =>
      batched(FRESH_CHILD_BATCH, () => {
        runOneRequest();
      }),
  };
}

/**
 * Builds Awilix's fresh-child scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixFreshChildScenarios(): ReadonlyArray<BenchScenario> {
  return FRESH_CHILD_RESOLVES.map((count) => buildFreshChildScenario(count));
}
