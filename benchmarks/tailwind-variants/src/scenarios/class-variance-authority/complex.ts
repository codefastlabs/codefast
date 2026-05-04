import { twMerge } from "tailwind-merge";
import { cva } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";
import { complexTestProps, complexVariants } from "#/fixtures/complex";

const cvaInstance = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * @since 0.3.16-canary.0
 */
export function buildClassVarianceAuthorityComplexScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "complex-without-merge",
      group: "complex",
      what: "Complex variants (cva) without tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          cvaInstance(props);
        }
      },
    },
    {
      id: "complex-with-merge",
      group: "complex",
      what: "Complex variants with tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          twMerge(cvaInstance(props));
        }
      },
    },
  ];
}
