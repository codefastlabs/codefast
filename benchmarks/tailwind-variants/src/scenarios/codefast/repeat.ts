import { repeatSimpleTestProps, repeatSlotsTestProps } from "#/fixtures/repeat";
import {
  REPEAT_SIMPLE_WITH_MERGE,
  REPEAT_SIMPLE_WITHOUT_MERGE,
  REPEAT_SLOTS_WITH_MERGE,
  REPEAT_SLOTS_WITHOUT_MERGE,
} from "#/fixtures/scenario-parity";
import { buttonVariants } from "#/fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#/fixtures/slot-types";
import { slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderCardSlots } from "#/lib/render-slots";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const flatNoMerge = codefastTvFn(buttonVariants, TV_MERGE_DISABLED) as FlatRenderer;
const flatWithMerge = codefastTvFn(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
const slotsNoMerge = codefastTvFn(slotsVariants, TV_MERGE_DISABLED) as CardRenderer;
const slotsWithMerge = codefastTvFn(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;

function runSlotLoop(renderer: CardRenderer): void {
  for (const props of repeatSlotsTestProps) {
    renderCardSlots(renderer(props));
  }
}

/**
 * @since 0.6.0
 */
export function buildCodefastRepeatScenarios(): ReadonlyArray<BenchScenario> {
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
