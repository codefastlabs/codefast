import { repeatSimpleTestProps, repeatSlotsTestProps } from "#/fixtures/repeat";
import {
  REPEAT_SIMPLE_WITH_MERGE,
  REPEAT_SIMPLE_WITHOUT_MERGE,
  REPEAT_SLOTS_WITH_MERGE,
  REPEAT_SLOTS_WITHOUT_MERGE,
} from "#/fixtures/scenario-parity";
import { buttonVariants } from "#/fixtures/simple";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

type RepeatProps = Record<string, string>;
type SlotsRenderer = (props: RepeatProps) => ServicePreviewSlots;

const flatNoMerge = tailwindVariantsTv(buttonVariants, TV_MERGE_DISABLED) as (props: RepeatProps) => string;
const flatWithMerge = tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as (props: RepeatProps) => string;
const slotsNoMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_DISABLED) as SlotsRenderer;
const slotsWithMerge = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as SlotsRenderer;

function runSlotLoop(renderer: SlotsRenderer): void {
  for (const props of repeatSlotsTestProps) {
    const { base, content, description, footer, header, title } = renderer(props);

    base();
    header();
    content();
    footer();
    title();
    description();
  }
}

export function buildTailwindVariantsNpmRepeatScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...REPEAT_SIMPLE_WITHOUT_MERGE,
      build: () => () => {
        for (const props of repeatSimpleTestProps) {
          flatNoMerge(props);
        }
      },
    },
    {
      ...REPEAT_SIMPLE_WITH_MERGE,
      build: () => () => {
        for (const props of repeatSimpleTestProps) {
          flatWithMerge(props);
        }
      },
    },
    {
      ...REPEAT_SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(slotsNoMerge),
    },
    {
      ...REPEAT_SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(slotsWithMerge),
    },
  ];
}
