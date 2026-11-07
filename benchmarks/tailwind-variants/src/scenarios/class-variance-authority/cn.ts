/** The `cn` row for cva: its clsx-style join followed by `tailwind-merge`, the usual production `cn`. */
import { twMerge } from "tailwind-merge";

import { cnTestCalls } from "#fixtures/cn";
import { CN_WITH_MERGE } from "#fixtures/scenario-parity";
import { cvaCx } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `cn` row.
 *
 * @since 0.11.1
 */
export function buildClassVarianceAuthorityCnScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CN_WITH_MERGE,
      what: "cn() calls shaped like a component library's, as twMerge(cx(...))",
      build: () => () => {
        for (const call of cnTestCalls) {
          twMerge(cvaCx(...call));
        }
      },
    },
  ];
}
