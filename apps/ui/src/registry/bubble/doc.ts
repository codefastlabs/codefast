import { BubbleInteractive } from "#/registry/bubble/interactive.example";
import { BubbleReactionsExample } from "#/registry/bubble/reactions.example";
import { BubbleVariants } from "#/registry/bubble/variants.example";
import { docAnatomy, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const bubbleDoc: ComponentDoc = {
  examples: [
    {
      id: "bubble-variants",
      title: "Variants",
      description:
        "Seven color variants. The variant paints the nested BubbleContent, so the color follows the author regardless of alignment.",
      Demo: BubbleVariants,
      source: docSource("bubble", "variants"),
    },
    {
      id: "bubble-reactions",
      title: "Reactions",
      description:
        "BubbleReactions overlaps a reaction pill on a bubble corner. Use side (top/bottom) and align (start/end) to place it.",
      Demo: BubbleReactionsExample,
      source: docSource("bubble", "reactions"),
    },
    {
      id: "bubble-interactive",
      title: "Interactive",
      description:
        "Render BubbleContent as a button or link with asChild to make a bubble actionable; hover styling adapts per variant.",
      Demo: BubbleInteractive,
      source: docSource("bubble", "interactive"),
    },
  ],
  anatomy: docAnatomy("bubble"),
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
