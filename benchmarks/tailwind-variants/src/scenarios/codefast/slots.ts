import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";

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
export function buildCodefastSlotsScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "slots-without-merge",
      group: "slots",
      what: "Slots (card-style) without tailwind-merge",
      build: () => () => runSlotLoop(codefastNoMerge),
    },
    {
      id: "slots-with-merge",
      group: "slots",
      what: "Slots with tailwind-merge on tv",
      build: () => () => runSlotLoop(codefastWithMerge),
    },
  ];
}
