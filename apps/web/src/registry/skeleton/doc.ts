import { SkeletonAvatar } from "#/registry/skeleton/avatar.example";
import { SkeletonCard } from "#/registry/skeleton/card.example";
import { SkeletonForm } from "#/registry/skeleton/form.example";
import { SkeletonRtl } from "#/registry/skeleton/rtl.example";
import { SkeletonTable } from "#/registry/skeleton/table.example";
import { SkeletonText } from "#/registry/skeleton/text.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

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
      id: "text",
      title: "Text lines",
      description: "Stand in for a paragraph while content loads.",
      Demo: SkeletonText,
      source: docSource("skeleton", "text"),
      previewClassName: "items-start",
    },
    {
      id: "skeleton-avatar",
      title: "Avatar",
      description: "Use to show a placeholder while content is loading.",
      Demo: SkeletonAvatar,
      source: docSource("skeleton", "avatar"),
    },
    {
      id: "skeleton-form",
      title: "Form",
      description: "Use to show a placeholder while content is loading.",
      Demo: SkeletonForm,
      source: docSource("skeleton", "form"),
    },
    {
      id: "skeleton-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SkeletonRtl,
      source: docSource("skeleton", "rtl"),
      direction: "rtl",
    },
    {
      id: "skeleton-table",
      title: "Table",
      description: "Use to show a placeholder while content is loading.",
      Demo: SkeletonTable,
      source: docSource("skeleton", "table"),
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
