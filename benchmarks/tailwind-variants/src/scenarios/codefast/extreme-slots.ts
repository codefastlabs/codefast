import { extremeSlotsTestProps, extremeSlotsVariants } from "#/fixtures/extreme";
import { EXTREME_SLOTS_WITH_MERGE, EXTREME_SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { ExtremeDialogSlots } from "#/fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

type ExtremeSlotsProps = (typeof extremeSlotsTestProps)[number];
type ExtremeSlotsRenderer = (props: ExtremeSlotsProps) => ExtremeDialogSlots;

const codefastNoMerge = codefastTvFn(extremeSlotsVariants, TV_MERGE_DISABLED) as ExtremeSlotsRenderer;
const codefastWithMerge = codefastTvFn(extremeSlotsVariants, TV_MERGE_ENABLED) as ExtremeSlotsRenderer;

function invokeAllSlots(slots: ExtremeDialogSlots): void {
  slots.trigger();
  slots.content();
  slots.header();
  slots.footer();
  slots.title();
  slots.description();
  slots.action();
  slots.icon();
  slots.overlay();
  slots.close();
  slots.separator();
  slots.badge();
}

function runExtremeSlotsLoop(renderer: ExtremeSlotsRenderer): void {
  for (const props of extremeSlotsTestProps) {
    invokeAllSlots(renderer(props));
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
