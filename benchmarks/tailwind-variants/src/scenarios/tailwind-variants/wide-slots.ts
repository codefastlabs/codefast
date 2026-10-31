/** The `wide-slots` row: a sixteen-slot component with twenty compound-tested variants. */
import { WIDE_SLOTS_WITH_MERGE } from "#fixtures/scenario-parity";
import { wideSlotsTestProps, wideSlotsVariants } from "#fixtures/wide-slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderEverySlot } from "#lib/render-slots";
import { tailwindVariantsTv } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `wide-slots` row.
 *
 * @since 0.11.1
 */
export function buildTailwindVariantsNpmWideSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...WIDE_SLOTS_WITH_MERGE,
      build: () => {
        const component = tailwindVariantsTv(wideSlotsVariants, TV_MERGE_ENABLED) as (
          props: Record<string, unknown>,
        ) => Readonly<Record<string, () => string>>;

        return () => {
          for (const props of wideSlotsTestProps) {
            renderEverySlot(component({ ...props }));
          }
        };
      },
    },
  ];
}
