/**
 * InversifyJS 8 — diagnostic scenarios. Parallel to
 * {@link ../codefast/diagnostic.ts}.
 */
import "reflect-metadata";
import { Container } from "inversify";
import type { BenchScenario } from "../types";
import { batched } from "../../harness/batched";

const CONTAINER_CREATE_BATCH = 200;

function buildDiagnosticContainerCreateEmptyScenario(): BenchScenario {
  return {
    id: "diagnostic-container-create-empty",
    group: "diagnostic",
    what: "allocate an empty container with no bindings (diagnostic baseline)",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => typeof new Container().bind === "function",
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        new Container();
      }),
  };
}

export function buildInversifyDiagnosticScenarios(): readonly BenchScenario[] {
  return [buildDiagnosticContainerCreateEmptyScenario()];
}
