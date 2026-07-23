import { SLOTS_WITH_MERGE, SLOTS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

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
