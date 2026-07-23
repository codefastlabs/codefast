import { twMerge } from "tailwind-merge";

import { SIMPLE_WITH_MERGE, SIMPLE_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";
import { cva } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const cvaInstance = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * @since 0.3.16-canary.0
 */
export function buildClassVarianceAuthoritySimpleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...SIMPLE_WITHOUT_MERGE,
      // cva-specific wording — the shared descriptor supplies the paired id/group
      what: "Simple button variants (cva) without tailwind-merge after cva()",
      build: () => () => {
        for (const props of simpleTestProps) {
          cvaInstance(props);
        }
      },
    },
    {
      ...SIMPLE_WITH_MERGE,
      what: "Simple button variants with tailwind-merge after cva()",
      build: () => () => {
        for (const props of simpleTestProps) {
          twMerge(cvaInstance(props));
        }
      },
    },
  ];
}
