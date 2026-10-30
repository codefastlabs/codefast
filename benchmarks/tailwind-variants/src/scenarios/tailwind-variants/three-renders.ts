/** The `three-renders-*` rows: a definition and the first three renders, which reach a lazy library's compile. */
import { COLD_DEFINITIONS_PER_LOOP, THREE_RENDERS_SIMPLE, THREE_RENDERS_SLOTS } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderEverySlot } from "#lib/render-slots";
import { tailwindVariantsTv } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

const BUTTON_SELECTIONS = [{}, { size: "sm", variant: "outline" }, { size: "lg", variant: "secondary" }] as const;
const CARD_SELECTIONS = [{}, { size: "md", variant: "info" }, { size: "lg", variant: "success" }] as const;

const defineAndRenderButton = (): number => {
  const button = tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
  let length = 0;

  for (const selection of BUTTON_SELECTIONS) {
    length += button({ ...selection }).length;
  }

  return length;
};

const defineAndRenderCard = (): number => {
  const card = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;
  let length = 0;

  for (const selection of CARD_SELECTIONS) {
    length += renderEverySlot(card({ ...selection }));
  }

  return length;
};

const repeatDefinitions = (defineAndRender: () => number) => {
  // Consuming the renders keeps each definition alive: a `tv` call nothing reads can be elided.
  let renderedLength = 0;

  return () => {
    for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
      renderedLength += defineAndRender();
    }

    if (renderedLength < 0) {
      throw new Error("unreachable");
    }
  };
};

/** Builds the `three-renders-*` rows. */
export function buildTailwindVariantsNpmThreeRendersScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...THREE_RENDERS_SIMPLE,
      build: () => repeatDefinitions(defineAndRenderButton),
      sanity: () => defineAndRenderButton() > 0,
    },
    {
      ...THREE_RENDERS_SLOTS,
      build: () => repeatDefinitions(defineAndRenderCard),
      sanity: () => defineAndRenderCard() > 0,
    },
  ];
}
