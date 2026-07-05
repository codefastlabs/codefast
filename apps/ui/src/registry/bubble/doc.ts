import { docDemo, docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { BubbleAlignment } from "#/registry/bubble/alignment.example";
import { BubbleCollapsible } from "#/registry/bubble/collapsible.example";
import { BubbleDemo } from "#/registry/bubble/demo";
import { BubbleGroupDemo } from "#/registry/bubble/group-demo.example";
import { BubbleLinkButton } from "#/registry/bubble/link-button.example";
import { BubbleMarkdown } from "#/registry/bubble/markdown.example";
import { BubblePopover } from "#/registry/bubble/popover.example";
import { BubbleReactionsDemo } from "#/registry/bubble/reactions.example";
import { BubbleTooltip } from "#/registry/bubble/tooltip.example";
import { BubbleVariants } from "#/registry/bubble/variants.example";

export const bubbleDoc: ComponentDoc = {
  usage: docUsage("bubble"),
  examples: [
    {
      id: "bubble-demo",
      title: "Demo",
      description: "A full thread — grouped bubbles, alternating sides, and reaction pills reading top to bottom.",
      Demo: BubbleDemo,
      source: docDemo("bubble"),
      previewClassName: "block",
    },
    {
      id: "bubble-variants",
      title: "Variants",
      description:
        "Seven color variants. The variant paints the nested BubbleContent, so the color follows the author regardless of alignment.",
      Demo: BubbleVariants,
      source: docSource("bubble", "variants"),
    },
    {
      id: "bubble-alignment",
      title: "Alignment",
      description: "align defaults to start; switch to end for the current user's own messages.",
      Demo: BubbleAlignment,
      source: docSource("bubble", "alignment"),
    },
    {
      id: "bubble-group-demo",
      title: "Group",
      description:
        "BubbleGroup stacks consecutive bubbles from one author with tight spacing so the thread scans cleanly.",
      Demo: BubbleGroupDemo,
      source: docSource("bubble", "group-demo"),
      previewClassName: "block",
    },
    {
      id: "bubble-reactions",
      title: "Reactions",
      description:
        "BubbleReactions overlaps a reaction pill on a bubble corner. Use side (top/bottom) and align (start/end) to place it.",
      Demo: BubbleReactionsDemo,
      source: docSource("bubble", "reactions"),
      previewClassName: "block",
    },
    {
      id: "bubble-link-button",
      title: "Link buttons",
      description: "Quick-reply bubbles: BubbleContent asChild wraps a real button so the whole bubble is one control.",
      Demo: BubbleLinkButton,
      source: docSource("bubble", "link-button"),
    },
    {
      id: "bubble-collapsible",
      title: "Collapsible",
      description: "Fold a long message behind a Show more toggle by nesting a Collapsible inside BubbleContent.",
      Demo: BubbleCollapsible,
      source: docSource("bubble", "collapsible"),
    },
    {
      id: "bubble-markdown",
      title: "Rich text",
      description:
        "Bubbles hold arbitrary markup — render assistant replies as paragraphs, ideal for the ghost variant.",
      Demo: BubbleMarkdown,
      source: docSource("bubble", "markdown"),
    },
    {
      id: "bubble-popover",
      title: "Popover",
      description: "Anchor a Popover in the reaction slot to surface details like an error trace on demand.",
      Demo: BubblePopover,
      source: docSource("bubble", "popover"),
    },
    {
      id: "bubble-tooltip",
      title: "Tooltip",
      description: "Put a read receipt in the reaction slot and reveal its timestamp with a Tooltip.",
      Demo: BubbleTooltip,
      source: docSource("bubble", "tooltip"),
    },
  ],
  anatomy: [
    {
      name: "BubbleGroup",
      children: [{ name: "Bubble", children: [{ name: "BubbleContent" }, { name: "BubbleReactions" }] }],
    },
  ],
  features: [
    "Seven color variants that always paint the nested BubbleContent, independent of align.",
    "BubbleContent's asChild turns the whole bubble into a real button or link, e.g. a quick-reply chip.",
    "BubbleReactions overlaps a pill on a configurable corner (side/align) of the bubble.",
  ],
  api: [
    {
      name: "Bubble",
      description: "Bubble wrapper. Sets the color variant and the side it sits on.",
      props: [
        {
          name: "variant",
          type: '"default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"',
          default: '"default"',
          description: "Color treatment applied to the nested BubbleContent.",
        },
        {
          name: "align",
          type: '"start" | "end"',
          default: '"start"',
          description: "Which side the bubble aligns to. Also mirrors inside a Message with data-align.",
        },
      ],
    },
    {
      name: "BubbleContent",
      description: "The colored surface holding the message body.",
      props: [
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Render as the child element (e.g. a button or link) for an actionable bubble.",
        },
      ],
    },
    {
      name: "BubbleReactions",
      description: "Reaction pill overlapping a bubble corner.",
      props: [
        { name: "side", type: '"top" | "bottom"', default: '"bottom"', description: "Vertical edge to overlap." },
        { name: "align", type: '"start" | "end"', default: '"end"', description: "Horizontal edge to anchor to." },
      ],
    },
    {
      name: "BubbleGroup",
      description: "Vertical stack of consecutive bubbles from one author.",
      props: [{ name: "children", type: "ReactNode", description: "One or more Bubble elements." }],
    },
  ],
  accessibility: {
    notes: [
      "Bubble is presentational — convey author and timestamp with real text (see Message), not color alone.",
      "For an actionable bubble, use asChild with a real button or anchor so it stays keyboard-focusable.",
      "Logical spacing and alignment mirror automatically under a DirectionProvider (RTL).",
    ],
  },
  guidelines: {
    do: [
      "Pair with Message to attach an avatar, header, and footer.",
      "Reserve the destructive variant for failed or removed messages.",
    ],
    dont: [
      "Don’t rely on variant color alone to distinguish authors — align and label them.",
      "Don’t nest interactive controls inside a non-asChild BubbleContent.",
    ],
  },
  related: ["message", "message-scroller", "avatar"],
};
