import { CONSTRUCT_SIMPLE, CONSTRUCT_SLOTS } from "#/fixtures/scenario-parity";
import { buttonVariants } from "#/fixtures/simple";
import type { ServicePreviewSlots } from "#/fixtures/slot-types";
import { slotsVariants } from "#/fixtures/slots";
import { TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const DEFINITIONS_PER_LOOP = 12;

const defineButton = (): string =>
  (tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as (props: unknown) => string)({
    size: "sm",
    variant: "outline",
  });

const defineCard = (): string =>
  (tailwindVariantsTv(slotsVariants, TV_MERGE_ENABLED) as (props: unknown) => ServicePreviewSlots)({
    size: "md",
    variant: "info",
  }).base();

/**
 * Construction is per component definition where every other scenario is per render, so a ratio
 * here does not belong in the same geomean as the resolution rows.
 *
 * @since 0.6.0
 */
export function buildTailwindVariantsNpmConstructScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CONSTRUCT_SIMPLE,
      batch: DEFINITIONS_PER_LOOP,
      excludeFromAggregates: true,
      // Consuming the render keeps the definition alive: a `tv` call nothing reads can be elided.
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineButton().length;
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineButton().length > 0,
    },
    {
      ...CONSTRUCT_SLOTS,
      batch: DEFINITIONS_PER_LOOP,
      excludeFromAggregates: true,
      build: () => {
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < DEFINITIONS_PER_LOOP; index++) {
            renderedLength += defineCard().length;
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      sanity: () => defineCard().length > 0,
    },
  ];
}
