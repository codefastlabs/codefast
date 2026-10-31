/** The `unique-class` row for cva: a `className` unique to every call, then `tailwind-merge`. */
import { twMerge } from "tailwind-merge";

import { uniqueClassName, uniqueClassSelections } from "#fixtures/novel-classes";
import { UNIQUE_CLASS_WITH_MERGE } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import { cva } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `unique-class` row.
 *
 * @since 0.11.1
 */
export function buildClassVarianceAuthorityUniqueClassScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...UNIQUE_CLASS_WITH_MERGE,
      what: "Button variants (cva) with a className no earlier call passed, tailwind-merge after cva()",
      build: () => {
        const button = cva(buttonVariants.base, {
          defaultVariants: buttonVariants.defaultVariants,
          variants: buttonVariants.variants,
        });
        let serial = 0;

        return () => {
          for (const props of uniqueClassSelections) {
            twMerge(button({ ...props, className: uniqueClassName(serial++) }));
          }
        };
      },
    },
  ];
}
