import type { ComponentDoc } from "#/components/examples/docs/types";
import { emptyAnatomyCode, emptyStateCode } from "#/components/examples/codes";
import { EmptyState } from "#/components/examples/docs/empty/state";

export const emptyDoc: ComponentDoc = {
  examples: [
    {
      id: "state",
      title: "Empty state with action",
      description: "Media, title, description, and a clear next step in one composed block.",
      Demo: EmptyState,
      code: emptyStateCode,
      previewClassName: "items-start",
    },
  ],
  anatomy: emptyAnatomyCode,
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
    dont: [
      "Don’t leave a blank area with no guidance.",
      "Don’t pile on multiple competing actions.",
    ],
  },
  related: ["card", "item", "button"],
};
