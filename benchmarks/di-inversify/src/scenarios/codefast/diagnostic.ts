/**
 * @codefast/di — diagnostic scenarios. These are library-internal
 * probes that useful as regression baselines but should not be read
 * as head-to-head performance claims. The reporter quarantines them
 * into their own section of the table.
 *
 *   - `diagnostic-container-create-empty` — how fast can you construct
 *     an empty container? Useful when optimising boot time, irrelevant
 *     to any real request path.
 */
import { Container } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CONTAINER_CREATE_BATCH = 200;

function buildDiagnosticContainerCreateEmptyScenario(): BenchScenario {
  return {
    id: "diagnostic-container-create-empty",
    group: "diagnostic",
    what: "allocate an empty container with no bindings (diagnostic baseline)",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => Container.create() !== undefined,
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        Container.create();
      }),
  };
}

export function buildCodefastDiagnosticScenarios(): readonly BenchScenario[] {
  return [buildDiagnosticContainerCreateEmptyScenario()];
}
