/** The `override` row for cva: its `className` prop appended, then `tailwind-merge` settles the conflicts. */
import { twMerge } from "tailwind-merge";

import { overrideTestProps } from "#fixtures/override";
import { OVERRIDE_WITH_MERGE } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import { cva } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

const button = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

/**
 * Builds the `override` row.
 *
 * @since 0.11.1
 */
export function buildClassVarianceAuthorityOverrideScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...OVERRIDE_WITH_MERGE,
      what: "Button variants (cva) from many call sites with their own className, tailwind-merge after cva()",
      build: () => () => {
        for (const props of overrideTestProps) {
          twMerge(button({ ...props }));
        }
      },
    },
  ];
}
