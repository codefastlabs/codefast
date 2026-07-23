import { SLOTS_WITH_MERGE, SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

type SlotsProps = (typeof slotsTestProps)[number];
type SlotsRenderer = (props: SlotsProps) => ServicePreviewSlots;

const codefastNoMerge = codefastTvFn(slotsVariants, TV_MERGE_DISABLED) as SlotsRenderer;
const codefastWithMerge = codefastTvFn(slotsVariants, TV_MERGE_ENABLED) as SlotsRenderer;

function runSlotLoop(renderer: SlotsRenderer): void {
  for (const props of slotsTestProps) {
    const { base, content, description, footer, header, title } = renderer(props);
    base();
    header();
    content();
    footer();
    title();
    description();
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastSlotsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(codefastNoMerge),
    },
    {
      ...SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(codefastWithMerge),
    },
  ];
}
