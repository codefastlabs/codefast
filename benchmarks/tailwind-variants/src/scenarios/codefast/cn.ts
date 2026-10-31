/** The `cn` row: calls shaped like a component library's own. */
import { cnTestCalls } from "#fixtures/cn";
import { CN_WITH_MERGE } from "#fixtures/scenario-parity";
import { codefastCn } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `cn` row.
 *
 * @since 0.11.1
 */
export function buildCodefastCnScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CN_WITH_MERGE,
      build: () => () => {
        for (const call of cnTestCalls) {
          codefastCn(...call);
        }
      },
    },
  ];
}
