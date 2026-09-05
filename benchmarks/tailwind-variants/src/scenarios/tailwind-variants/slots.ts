import { SLOTS_WITH_MERGE, SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { CardRenderer } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderCardSlots } from "#/lib/render-slots";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmNoMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_DISABLED) as CardRenderer;
const npmWithMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;

function runSlotLoop(renderer: CardRenderer): void {
  for (const props of slotsTestProps) {
    renderCardSlots(renderer(props));
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(npmNoMerge),
    },
    {
      ...SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(npmWithMerge),
    },
  ];
}
