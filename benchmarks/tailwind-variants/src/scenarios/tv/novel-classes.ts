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
import { joinEverySlot, joinFlatRenders, renderEverySlot } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the rows whose merges always miss, for one library.
 *
 * @since 0.11.1
 */
export function buildNovelClassesScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  // The first definition each cold row makes, rendered as its loop renders it; serial zero is as novel as any.
  const novelButton = (): FlatRenderer => library.tv(novelButtonVariants(0), TV_MERGE_ENABLED) as FlatRenderer;
  const novelCard = (): CardRenderer => library.tv(novelCardVariants(0), TV_MERGE_ENABLED) as CardRenderer;

  return [
    {
      ...UNIQUE_CLASS_WITH_MERGE,
      build: () => {
        const button = library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;
        let serial = 0;

        return () => {
          for (const props of uniqueClassSelections) {
            button({ ...props, className: uniqueClassName(serial++) });
          }
        };
      },
      output: () => {
        const button = library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;

        return uniqueClassSelections
          .map((props, serial) => button({ ...props, className: uniqueClassName(serial) }))
          .join("\n");
      },
    },
    {
      ...FIRST_RENDER_COLD_SIMPLE,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const button = library.tv(novelButtonVariants(serial++), TV_MERGE_ENABLED) as FlatRenderer;

            renderedLength += button({ size: "sm", variant: "outline" }).length;
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      output: () => novelButton()({ size: "sm", variant: "outline" }),
    },
    {
      ...FIRST_RENDER_COLD_SLOTS,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const card = library.tv(novelCardVariants(serial++), TV_MERGE_ENABLED) as CardRenderer;

            renderedLength += renderEverySlot(card({ size: "md", variant: "info" }));
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      output: () => joinEverySlot(novelCard()({ size: "md", variant: "info" })),
    },
    {
      ...FIRST_PAGE_COLD_SIMPLE,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const button = library.tv(novelButtonVariants(serial++), TV_MERGE_ENABLED) as FlatRenderer;

            for (const props of firstPageButtonCalls) {
              renderedLength += button({ ...props }).length;
            }
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      output: () => joinFlatRenders(novelButton(), firstPageButtonCalls),
    },
    {
      ...FIRST_PAGE_COLD_SLOTS,
      build: () => {
        let serial = 0;
        let renderedLength = 0;

        return () => {
          for (let index = 0; index < COLD_DEFINITIONS_PER_LOOP; index++) {
            const card = library.tv(novelCardVariants(serial++), TV_MERGE_ENABLED) as CardRenderer;

            for (const props of firstPageCardCalls) {
              renderedLength += renderEverySlot(card({ ...props }));
            }
          }

          if (renderedLength < 0) {
            throw new Error("unreachable");
          }
        };
      },
      output: () => {
        const card = novelCard();

        return firstPageCardCalls.map((props) => joinEverySlot(card({ ...props }))).join("\n\n");
      },
    },
  ];
}
