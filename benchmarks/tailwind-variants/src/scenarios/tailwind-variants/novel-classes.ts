/** The rows whose merges always miss: a `className` unique to every call, and first renders of distinct components. */
import {
  firstPageButtonCalls,
  firstPageCardCalls,
  novelButtonVariants,
  novelCardVariants,
  uniqueClassName,
  uniqueClassSelections,
} from "#fixtures/novel-classes";
import {
  COLD_DEFINITIONS_PER_LOOP,
  FIRST_PAGE_COLD_SIMPLE,
  FIRST_PAGE_COLD_SLOTS,
  FIRST_RENDER_COLD_SIMPLE,
  FIRST_RENDER_COLD_SLOTS,
  UNIQUE_CLASS_WITH_MERGE,
} from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { CardRenderer, FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { renderEverySlot } from "#lib/render-slots";
import { tailwindVariantsTv } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/** Builds the rows whose merges always miss. */
export function buildTailwindVariantsNpmNovelClassesScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...UNIQUE_CLASS_WITH_MERGE,
      build: () => {
        const button = tailwindVariantsTv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
        let serial = 0;

        return () => {
          for (const props of uniqueClassSelections) {
            button({ ...props, className: uniqueClassName(serial++) });
          }
        };
      },
    },
    {
      ...FIRST_RENDER_COLD_SIMPLE,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const button = tailwindVariantsTv(novelButtonVariants(serial++), TV_MERGE_ENABLED) as FlatRenderer;

            renderedLength += button({ size: "sm", variant: "outline" }).length;
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
    },
    {
      ...FIRST_RENDER_COLD_SLOTS,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const card = tailwindVariantsTv(novelCardVariants(serial++), TV_MERGE_ENABLED) as CardRenderer;

            renderedLength += renderEverySlot(card({ size: "md", variant: "info" }));
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
    },
    {
      ...FIRST_PAGE_COLD_SIMPLE,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const button = tailwindVariantsTv(novelButtonVariants(serial++), TV_MERGE_ENABLED) as FlatRenderer;

            for (const props of firstPageButtonCalls) {
              renderedLength += button({ ...props }).length;
            }
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
    },
    {
      ...FIRST_PAGE_COLD_SLOTS,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const card = tailwindVariantsTv(novelCardVariants(serial++), TV_MERGE_ENABLED) as CardRenderer;

            for (const props of firstPageCardCalls) {
              renderedLength += renderEverySlot(card({ ...props }));
            }
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
    },
  ];
}
