import { extendTailwindMerge } from "cn/config";

import {
  UNCACHED_SIMPLE_WITH_MERGE,
  UNCACHED_SIMPLE_WITHOUT_MERGE,
  UNCACHED_SLOTS_WITH_MERGE,
  UNCACHED_SLOTS_WITHOUT_MERGE,
} from "#fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { slotsTestProps, slotsVariants } from "#fixtures/slots";
import { codefast } from "#lib/codefast";
import { renderCardSlots } from "#lib/render-slots";
import type { BenchScenario } from "#scenarios/types";

/** Forces the plan walk and a real merge on every call: no resolution memo and no engine cache. */
const TV_CACHE_DISABLED = { cacheResolutions: false, twMerge: extendTailwindMerge({ cacheSize: 0 }) } as const;

/** The without-merge counterpart of `TV_CACHE_DISABLED`, so a paired control isolates the merge step. */
const TV_CACHE_AND_MERGE_DISABLED = { cacheResolutions: false, twMerge: false } as const;

const flat = codefast.tv(buttonVariants, TV_CACHE_DISABLED) as FlatRenderer;
const flatNoMerge = codefast.tv(buttonVariants, TV_CACHE_AND_MERGE_DISABLED) as FlatRenderer;
const slots = codefast.tv(slotsVariants, TV_CACHE_DISABLED) as CardRenderer;
const slotsNoMerge = codefast.tv(slotsVariants, TV_CACHE_AND_MERGE_DISABLED) as CardRenderer;

function runFlatLoop(renderer: FlatRenderer): void {
  for (const props of simpleTestProps) {
    renderer({ ...props });
  }
}

function runSlotLoop(renderer: CardRenderer): void {
  for (const props of slotsTestProps) {
    renderCardSlots(renderer({ ...props }));
  }
}

/**
 * Builds the codefast-only control rows that keep the resolver itself under measurement.
 *
 * @remarks Every other row's props repeat and hit a cache; these turn the resolution memo and the merge
 * cache off, and pair each with-merge row with a without-merge one so their delta is the merge step.
 *
 * @since 0.6.0
 */
export function buildCodefastUncachedScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...UNCACHED_SIMPLE_WITH_MERGE,
      build: () => () => runFlatLoop(flat),
    },
    {
      ...UNCACHED_SIMPLE_WITHOUT_MERGE,
      build: () => () => runFlatLoop(flatNoMerge),
    },
    {
      ...UNCACHED_SLOTS_WITH_MERGE,
      build: () => () => runSlotLoop(slots),
    },
    {
      ...UNCACHED_SLOTS_WITHOUT_MERGE,
      build: () => () => runSlotLoop(slotsNoMerge),
    },
  ];
}
