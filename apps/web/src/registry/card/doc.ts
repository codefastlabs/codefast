import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { CardEdgeToEdge } from "#/registry/card/edge-to-edge.example";
import { CardImage } from "#/registry/card/image.example";
import { CardRtl } from "#/registry/card/rtl.example";
import { CardSmall } from "#/registry/card/small.example";
import { CardSpacing } from "#/registry/card/spacing.example";

export const cardDoc: ComponentDoc = {
  usage: docUsage("card"),
  examples: [
    {
      id: "card-edge-to-edge",
      title: "Spacing",
      description:
        "Use negative margins with -mx-(--card-spacing) to make content go edge to edge while keeping it aligned with the card inset. When the edge-to-edge content sits above a footer, use -mb-(--card-spacing) on CardContent to remove the section gap.",
      Demo: CardEdgeToEdge,
      source: docSource("card", "edge-to-edge"),
    },
    {
      id: "card-image",
      title: "Image",
      description: "Add an image before the card header to create a card with an image.",
      Demo: CardImage,
      source: docSource("card", "image"),
    },
    {
      id: "card-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CardRtl,
      source: docSource("card", "rtl"),
      direction: "rtl",
    },
    {
      id: "card-small",
      title: "Size",
      description:
        "Use the size='sm' prop to set the size of the card to small. The small size variant uses smaller spacing.",
      Demo: CardSmall,
      source: docSource("card", "small"),
    },
    {
      id: "card-spacing",
      title: "Spacing",
      description:
        "In addition to the size prop, you can use the --card-spacing CSS variable to control the spacing between sections and the inset of card parts.",
      Demo: CardSpacing,
      source: docSource("card", "spacing"),
    },
  ],
  anatomy: [
    {
      name: "Card",
      children: [
        { name: "CardHeader", children: [{ name: "CardTitle" }, { name: "CardDescription" }, { name: "CardAction" }] },
        { name: "CardContent" },
        { name: "CardFooter" },
      ],
    },
  ],
  features: [
    "Two sizes (default, sm) via the --card-spacing CSS variable, adjustable per-instance without a new size value.",
    "CardHeader switches to a 2-column grid automatically when a CardAction is present, and reserves a second row when a CardDescription follows the title.",
    "A leading or trailing <img> direct child gets its corners rounded to match the card automatically.",
  ],
  api: [
    {
      name: "Card",
      description: "The surface. Every part below is a styled <div> you can omit or reorder.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Compose width, shadow, and spacing — the card owns no layout of its own.",
        },
      ],
    },
    {
      name: "CardHeader",
      description: "Hosts CardTitle, CardDescription, and an optional CardAction.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "CardTitle, CardDescription, and an optional CardAction.",
        },
      ],
    },
    {
      name: "CardFooter",
      description: "The bottom bar, set off from CardContent by a border and muted background.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Footer actions or supplementary content.",
        },
      ],
    },
    {
      name: "CardContent",
      description: "The main body of the card.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The card's primary content.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Card is a presentational container with no implicit role — structure content with real headings.",
      "When a whole card is clickable, wrap it in a single link/button rather than nesting interactives.",
      "Use CardTitle as a real heading level that fits the surrounding document outline.",
    ],
  },
  guidelines: {
    do: [
      "Group genuinely related content; one idea per card.",
      "Keep actions in CardFooter or CardAction so they’re easy to find.",
    ],
    dont: [
      "Don’t nest cards inside cards — it muddies hierarchy.",
      "Don’t put more than one primary action in a single card.",
    ],
  },
  related: ["item", "accordion", "separator"],
};
