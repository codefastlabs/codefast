import { SkeletonCard } from "#/components/examples/skeleton.card";
import { SkeletonList } from "#/components/examples/skeleton.list";
import { SkeletonText } from "#/components/examples/skeleton.text";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const skeletonDoc: ComponentDoc = {
  examples: [
    {
      id: "card",
      title: "Card placeholder",
      description: "Mirror the real layout so content doesn’t jump when it loads.",
      Demo: SkeletonCard,
      source: docSource("skeleton", "card"),
      previewClassName: "items-start",
    },
    {
      id: "list",
      title: "List rows",
      description: "Repeat a simple row shape for lists and feeds.",
      Demo: SkeletonList,
      source: docSource("skeleton", "list"),
      previewClassName: "items-start",
    },
    {
      id: "text",
      title: "Text lines",
      description: "Stand in for a paragraph while content loads.",
      Demo: SkeletonText,
      source: docSource("skeleton", "text"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("skeleton"),
  api: [
    {
      name: "Skeleton",
      description: "A shimmering placeholder block. Shape it entirely with className.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Set width, height, and radius to match the content it stands in for.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Skeletons are decorative — mark the loading region with aria-busy on its container.",
      "Keep the skeleton’s shape close to the real content to avoid layout shift.",
      "Don’t leave skeletons up indefinitely; show an error state if loading fails.",
    ],
  },
  guidelines: {
    do: [
      "Match the skeleton to the final layout’s size and shape.",
      "Use for content that takes a noticeable moment to load.",
    ],
    dont: [
      "Don’t use a skeleton for instant content — it just adds flicker.",
      "Don’t animate so strongly it distracts; keep the shimmer subtle.",
    ],
  },
  related: ["spinner", "progress", "card"],
};
