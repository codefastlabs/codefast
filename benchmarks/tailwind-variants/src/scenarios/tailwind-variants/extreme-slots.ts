import { extremeSlotsTestProps, extremeSlotsVariants } from "#/fixtures/extreme";
import { EXTREME_SLOTS_WITH_MERGE, EXTREME_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { DialogRenderer } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderDialogSlots } from "#/lib/render-slots";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmNoMerge = tailwindVariantsTv(extremeSlotsVariants, TV_MERGE_DISABLED) as DialogRenderer;
const npmWithMerge = tailwindVariantsTv(extremeSlotsVariants, TV_MERGE_ENABLED) as DialogRenderer;

function runExtremeSlotsLoop(renderer: DialogRenderer): void {
  for (const props of extremeSlotsTestProps) {
    renderDialogSlots(renderer(props));
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmExtremeSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTREME_SLOTS_WITHOUT_MERGE,
      build: () => () => runExtremeSlotsLoop(npmNoMerge),
    },
    {
      ...EXTREME_SLOTS_WITH_MERGE,
      build: () => () => runExtremeSlotsLoop(npmWithMerge),
    },
  ];
}
