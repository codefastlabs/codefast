import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";

type SlotsProps = (typeof slotsTestProps)[number];
type SlotsRenderer = (props: SlotsProps) => ServicePreviewSlots;

const npmNoMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_DISABLED) as SlotsRenderer;
const npmWithMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as SlotsRenderer;

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
export function buildTailwindVariantsNpmSlotsScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "slots-without-merge",
      group: "slots",
      what: "Slots (card-style) without tailwind-merge",
      build: () => () => runSlotLoop(npmNoMerge),
    },
    {
      id: "slots-with-merge",
      group: "slots",
      what: "Slots with tailwind-merge on tv",
      build: () => () => runSlotLoop(npmWithMerge),
    },
  ];
}
