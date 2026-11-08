/** The `define-only-*` rows: a component definition with no render. */
import { COLD_DEFINITIONS_PER_LOOP, DEFINE_ONLY_SIMPLE, DEFINE_ONLY_SLOTS } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import { slotsVariants } from "#fixtures/slots";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the define-only rows for one library, which price a component definition with no render.
 *
 * @remarks An eager library compiles here and a lazy one defers to its first render, so the descriptors
 * keep the ratio off the aggregates. A definition renders nothing, so these rows have no output to compare.
 */
export function buildDefineOnlyScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const defineButton = (): unknown => library.tv(buttonVariants, TV_MERGE_ENABLED);
  const defineCard = (): unknown => library.tv(slotsVariants, TV_MERGE_ENABLED);

  return [
    {
      ...DEFINE_ONLY_SIMPLE,
      // Storing each definition keeps it alive: a `tv` call nothing reads can be elided.
      build: () => {
        const definitions: Array<unknown> = [];

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            definitions[index] = defineButton();
          }
        };
      },
      sanity: () => typeof defineButton() === "function",
    },
    {
      ...DEFINE_ONLY_SLOTS,
      build: () => {
        const definitions: Array<unknown> = [];

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            definitions[index] = defineCard();
          }
        };
      },
      sanity: () => typeof defineCard() === "function",
    },
  ];
}
