import { HoverCardLinkPreview } from "#/components/examples/hover-card.link-preview";
import { HoverCardProfile } from "#/components/examples/hover-card.profile";
import { HoverCardStat } from "#/components/examples/hover-card.stat";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const hoverCardDoc: ComponentDoc = {
  examples: [
    {
      id: "profile",
      title: "Profile preview",
      description: "Hover the trigger to reveal a rich preview after a short delay.",
      Demo: HoverCardProfile,
      source: docSource("hover-card", "profile"),
      previewClassName: "min-h-40",
    },
    {
      id: "link-preview",
      title: "Inline link preview",
      description: "Reveal context when hovering an inline link.",
      Demo: HoverCardLinkPreview,
      source: docSource("hover-card", "link-preview"),
    },
    {
      id: "stat",
      title: "Stat breakdown",
      description: "Expand a summary number into its details on hover.",
      Demo: HoverCardStat,
      source: docSource("hover-card", "stat"),
    },
  ],
  anatomy: docAnatomy("hover-card"),
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
