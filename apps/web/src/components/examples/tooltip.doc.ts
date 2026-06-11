import { docSource, docAnatomy } from "#/components/examples/source";
import { TooltipSides } from "#/components/examples/tooltip.sides";
import { TooltipToolbar } from "#/components/examples/tooltip.toolbar";
import { TooltipWithShortcut } from "#/components/examples/tooltip.with-shortcut";
import type { ComponentDoc } from "#/components/examples/types";

export const tooltipDoc: ComponentDoc = {
  examples: [
    {
      id: "sides",
      title: "Placement",
      description: "Anchor the tooltip to any side of the trigger.",
      Demo: TooltipSides,
      source: docSource("tooltip", "sides"),
    },
    {
      id: "with-shortcut",
      title: "With shortcut",
      description: "Tooltips can hold rich content, including Kbd shortcut hints.",
      Demo: TooltipWithShortcut,
      source: docSource("tooltip", "with-shortcut"),
    },
    {
      id: "toolbar",
      title: "Icon toolbar",
      description: "One tooltip per icon button in a toolbar.",
      Demo: TooltipToolbar,
      source: docSource("tooltip", "toolbar"),
    },
  ],
  anatomy: docAnatomy("tooltip"),
  api: [
    {
      name: "TooltipProvider",
      description: "Wrap your app (or a region) once; shares timing across tooltips.",
      props: [
        {
          name: "delayDuration",
          type: "number",
          default: "700",
          description: "Milliseconds to hover before the tooltip opens.",
        },
        {
          name: "skipDelayDuration",
          type: "number",
          default: "300",
          description: "Window in which moving between triggers skips the delay.",
        },
      ],
    },
    {
      name: "TooltipContent",
      props: [
        {
          name: "side",
          type: '"top" | "right" | "bottom" | "left"',
          default: '"top"',
          description: "Preferred side relative to the trigger.",
        },
        {
          name: "sideOffset",
          type: "number",
          default: "0",
          description: "Distance in px between the trigger and the content.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Focusing the trigger opens the tooltip." },
      { keys: ["Esc"], description: "Closes the open tooltip." },
    ],
    notes: [
      "The trigger must be a focusable element — use asChild over a Button or link.",
      "Tooltips are supplementary: never put essential information or actions inside one.",
      "Content is linked to the trigger via aria-describedby for screen readers.",
    ],
  },
  guidelines: {
    do: ["Keep tooltip text to a short phrase.", "Use for naming icon-only controls and surfacing shortcuts."],
    dont: [
      "Don’t place interactive controls inside a tooltip — use a Popover.",
      "Don’t hide information the user needs to complete a task.",
    ],
  },
  related: ["popover", "hover-card", "kbd"],
};
