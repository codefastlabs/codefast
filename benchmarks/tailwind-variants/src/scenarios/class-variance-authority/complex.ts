import { twMerge } from "tailwind-merge";

import { complexTestProps, complexVariants } from "#/fixtures/complex";
import { COMPLEX_WITH_MERGE, COMPLEX_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { cva } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const cvaInstance = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * @since 0.3.16-canary.0
 */
export function buildClassVarianceAuthorityComplexScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...COMPLEX_WITHOUT_MERGE,
      // cva-specific wording — the shared descriptor supplies the paired id/group
      what: "Complex variants (cva) without tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          cvaInstance(props);
        }
      },
    },
    {
      ...COMPLEX_WITH_MERGE,
      what: "Complex variants with tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          twMerge(cvaInstance(props));
        }
      },
    },
  ];
}
