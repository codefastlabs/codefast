import { docDemo, docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { HoverCardDemo } from "#/registry/hover-card/demo";
import { HoverCardRtl } from "#/registry/hover-card/rtl.example";
import { HoverCardSides } from "#/registry/hover-card/sides.example";

export const hoverCardDoc: ComponentDoc = {
  examples: [
    {
      id: "hover-card-demo",
      title: "Demo",
      description: "A link preview card that opens on hover or focus.",
      Demo: HoverCardDemo,
      source: docDemo("hover-card"),
    },
    {
      id: "hover-card-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: HoverCardRtl,
      source: docSource("hover-card", "rtl"),
      direction: "rtl",
    },
    {
      id: "hover-card-sides",
      title: "Sides",
      description: "For sighted users to preview content available behind a link.",
      Demo: HoverCardSides,
      source: docSource("hover-card", "sides"),
    },
  ],
  anatomy: [{ name: "HoverCard", children: [{ name: "HoverCardTrigger" }, { name: "HoverCardContent" }] }],
  features: [
    "Opens on hover and on keyboard focus of the trigger — not hover-only.",
    "openDelay/closeDelay (default 700ms/300ms) tune how long to hover before opening or closing.",
    "side/align on HoverCardContent control placement, the same positioning primitives as Popover and Tooltip.",
  ],
  api: [
    {
      name: "HoverCard",
      description: "Root. Opens on hover/focus of the trigger.",
      props: [
        {
          name: "openDelay",
          type: "number",
          default: "700",
          description: "Milliseconds to hover before opening.",
        },
        {
          name: "closeDelay",
          type: "number",
          default: "300",
          description: "Milliseconds before closing after the pointer leaves.",
        },
      ],
    },
    {
      name: "HoverCardContent",
      props: [
        {
          name: "side / align",
          type: '"top"|"right"|"bottom"|"left" / "start"|"center"|"end"',
          description: "Placement relative to the trigger.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Opens on hover and on keyboard focus of the trigger.",
      "Content is supplementary — never put essential info or actions only here.",
      "Touch devices don’t hover; ensure the same info is reachable another way.",
    ],
  },
  guidelines: {
    do: ["Use for non-essential previews — profiles, link cards.", "Keep the trigger a real link or button."],
    dont: ["Don’t put interactive controls inside — use a Popover.", "Don’t hide critical content behind hover."],
  },
  related: ["popover", "tooltip", "avatar"],
};
