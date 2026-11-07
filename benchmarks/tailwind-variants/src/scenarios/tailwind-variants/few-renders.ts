/** The `two-renders-*` and `three-renders-*` rows: a definition and its first renders, which reach a lazy library's compile. */
import {
  COLD_DEFINITIONS_PER_LOOP,
  THREE_RENDERS_SIMPLE,
  THREE_RENDERS_SLOTS,
  TWO_RENDERS_SIMPLE,
  TWO_RENDERS_SLOTS,
  TWO_RENDERS_WIDE,
} from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { slotsVariants } from "#fixtures/slots";
import { wideFlatSelections, wideFlatVariants } from "#fixtures/wide-flat";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderEverySlot } from "#lib/render-slots";
import { tailwindVariantsTv } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

const BUTTON_SELECTIONS = [{}, { size: "sm", variant: "outline" }, { size: "lg", variant: "secondary" }] as const;
const CARD_SELECTIONS = [{}, { size: "md", variant: "info" }, { size: "lg", variant: "success" }] as const;

const defineAndRenderButton = (renders: number): number => {
  const button = tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
  let length = 0;

  for (let index = 0; index < renders; index++) {
    length += button({ ...BUTTON_SELECTIONS[index] }).length;
  }

  return length;
};

const defineAndRenderCard = (renders: number): number => {
  const card = tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer;
  let length = 0;

  for (let index = 0; index < renders; index++) {
    length += renderEverySlot(card({ ...CARD_SELECTIONS[index] }));
  }

  return length;
};

const defineAndRenderWide = (renders: number): number => {
  const component = tailwindVariantsTv(wideFlatVariants, TV_MERGE_ENABLED) as FlatRenderer;
  let length = 0;

  for (let index = 0; index < renders; index++) {
    length += component({ ...wideFlatSelections[index] }).length;
  }

  return length;
};

const repeatDefinitions = (defineAndRender: (renders: number) => number, renders: number) => {
  // Consuming the renders keeps each definition alive: a `tv` call nothing reads can be elided.
  let renderedLength = 0;

  return () => {
    for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
      renderedLength += defineAndRender(renders);
    }

    if (renderedLength < 0) {
      throw new Error("unreachable");
    }
  };
};

/**
 * Builds the `two-renders-*` and `three-renders-*` rows.
 *
 * @since 0.11.1
 */
export function buildTailwindVariantsNpmFewRendersScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...TWO_RENDERS_SIMPLE,
      build: () => repeatDefinitions(defineAndRenderButton, 2),
      sanity: () => defineAndRenderButton(2) > 0,
    },
    {
      ...TWO_RENDERS_SLOTS,
      build: () => repeatDefinitions(defineAndRenderCard, 2),
      sanity: () => defineAndRenderCard(2) > 0,
    },
    {
      ...TWO_RENDERS_WIDE,
      build: () => repeatDefinitions(defineAndRenderWide, 2),
      sanity: () => defineAndRenderWide(2) > 0,
    },
    {
      ...THREE_RENDERS_SIMPLE,
      build: () => repeatDefinitions(defineAndRenderButton, 3),
      sanity: () => defineAndRenderButton(3) > 0,
    },
    {
      ...THREE_RENDERS_SLOTS,
      build: () => repeatDefinitions(defineAndRenderCard, 3),
      sanity: () => defineAndRenderCard(3) > 0,
    },
  ];
}
