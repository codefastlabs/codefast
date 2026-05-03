import { twMerge } from "tailwind-merge";
import { cva } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";
import { complexTestProps, complexVariants } from "#/fixtures/complex";

const cvaNoMerge = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});
const cvaWithMerge = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

export function buildClassVarianceAuthorityComplexScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "complex-without-merge",
      group: "complex",
      what: "Complex variants (cva) without tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          cvaNoMerge(props);
        }
      },
    },
    {
      id: "complex-with-merge",
      group: "complex",
      what: "Complex variants with tailwind-merge after cva()",
      build: () => () => {
        for (const props of complexTestProps) {
          twMerge(cvaWithMerge(props));
        }
      },
    },
  ];
}
