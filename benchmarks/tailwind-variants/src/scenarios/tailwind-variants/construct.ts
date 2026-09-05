import { CONSTRUCT_DEFINITIONS_PER_LOOP, CONSTRUCT_SIMPLE, CONSTRUCT_SLOTS } from "#/fixtures/scenario-parity";
import { buttonVariants } from "#/fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#/fixtures/slot-types";
import { slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_ENABLED } from "#/harness/bench-options";
import { renderEverySlot } from "#/lib/render-slots";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const defineButton = (): number =>
  (tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer)({ size: "sm", variant: "outline" }).length;

// Every slot renders: one library merges all slots on the first render, the other merges each slot on demand.
const defineCard = (): number =>
  renderEverySlot(
    (tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as CardRenderer)({ size: "md", variant: "info" }),
  );

/**
 * Builds the construct rows, which price a component definition rather than a render.
 *
 * @remarks A ratio here does not belong in the geomean with the resolution rows, so the descriptors keep it off.
 *
 * @since 0.6.0
 */
export function buildTailwindVariantsNpmConstructScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CONSTRUCT_SIMPLE,
      // Consuming the render keeps the definition alive: a `tv` call nothing reads can be elided.
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < CONSTRUCT_DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineButton();
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineButton() > 0,
    },
    {
      ...CONSTRUCT_SLOTS,
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < CONSTRUCT_DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineCard();
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineCard() > 0,
    },
  ];
}
