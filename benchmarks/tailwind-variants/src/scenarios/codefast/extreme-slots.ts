import { extremeSlotsTestProps, extremeSlotsVariants } from "#/fixtures/extreme";
import { EXTREME_SLOTS_WITH_MERGE, EXTREME_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { DialogRenderer } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderDialogSlots } from "#/lib/render-slots";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const codefastNoMerge = codefastTvFn(extremeSlotsVariants, TV_MERGE_DISABLED) as DialogRenderer;
const codefastWithMerge = codefastTvFn(extremeSlotsVariants, TV_MERGE_ENABLED) as DialogRenderer;

function runExtremeSlotsLoop(renderer: DialogRenderer): void {
  for (const props of extremeSlotsTestProps) {
    renderDialogSlots(renderer(props));
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastExtremeSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTREME_SLOTS_WITHOUT_MERGE,
      build: () => () => runExtremeSlotsLoop(codefastNoMerge),
    },
    {
      ...EXTREME_SLOTS_WITH_MERGE,
      build: () => () => runExtremeSlotsLoop(codefastWithMerge),
    },
  ];
}
