import { twMerge } from "tailwind-merge";
import { cva } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";

const cvaInstance = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

export function buildClassVarianceAuthoritySimpleScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "simple-without-merge",
      group: "simple",
      what: "Simple button variants (cva) without tailwind-merge after cva()",
      build: () => () => {
        for (const props of simpleTestProps) {
          cvaInstance(props);
        }
      },
    },
    {
      id: "simple-with-merge",
      group: "simple",
      what: "Simple button variants with tailwind-merge after cva()",
      build: () => () => {
        for (const props of simpleTestProps) {
          twMerge(cvaInstance(props));
        }
      },
    },
  ];
}
