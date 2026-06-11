import { EmptyMinimal } from "#/components/examples/empty.minimal";
import { EmptySearch } from "#/components/examples/empty.search";
import { EmptyState } from "#/components/examples/empty.state";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const emptyDoc: ComponentDoc = {
  examples: [
    {
      id: "state",
      title: "Empty state with action",
      description: "Media, title, description, and a clear next step in one composed block.",
      Demo: EmptyState,
      source: docSource("empty", "state"),
      previewClassName: "items-start",
    },
    {
      id: "search",
      title: "No search results",
      description: "Swap the icon and action for a zero-results state.",
      Demo: EmptySearch,
      source: docSource("empty", "search"),
      previewClassName: "items-start",
    },
    {
      id: "minimal",
      title: "Without media",
      description: "Just a title and description — no icon or action.",
      Demo: EmptyMinimal,
      source: docSource("empty", "minimal"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("empty"),
  api: [
    {
      name: "Empty",
      description: "Layout wrapper for an empty/zero state.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Compose EmptyHeader (media, title, description) and EmptyContent (action).",
        },
      ],
    },
    {
      name: "EmptyMedia / EmptyTitle / EmptyDescription / EmptyContent",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The icon/illustration, headline, supporting text, and action slot.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Use a real heading for EmptyTitle so it fits the document outline.",
      "Always give users a next step — a button or link out of the empty state.",
      "Keep the icon decorative; the meaning lives in the title and description.",
    ],
  },
  guidelines: {
    do: ["Explain why it’s empty and what to do next.", "Offer a single, primary action."],
    dont: ["Don’t leave a blank area with no guidance.", "Don’t pile on multiple competing actions."],
  },
  related: ["card", "item", "button"],
};
