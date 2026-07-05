import { docSource, docUsage } from "#/registry/source";
import { TooltipDisabled } from "#/registry/tooltip/disabled.example";
import { TooltipKeyboard } from "#/registry/tooltip/keyboard.example";
import { TooltipRtl } from "#/registry/tooltip/rtl.example";
import { TooltipSides } from "#/registry/tooltip/sides.example";
import type { ComponentDoc } from "#/registry/types";

export const tooltipDoc: ComponentDoc = {
  usage: docUsage("tooltip"),
  examples: [
    {
      id: "sides",
      title: "Placement",
      description: "Anchor the tooltip to any side of the trigger.",
      Demo: TooltipSides,
      source: docSource("tooltip", "sides"),
    },
    {
      id: "tooltip-disabled",
      title: "Disabled Button",
      description: "Show a tooltip on a disabled button by wrapping it with a span.",
      Demo: TooltipDisabled,
      source: docSource("tooltip", "disabled"),
    },
    {
      id: "tooltip-keyboard",
      title: "With Keyboard Shortcut",
      description:
        "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
      Demo: TooltipKeyboard,
      source: docSource("tooltip", "keyboard"),
    },
    {
      id: "tooltip-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: TooltipRtl,
      source: docSource("tooltip", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "TooltipProvider",
      children: [{ name: "Tooltip", children: [{ name: "TooltipTrigger" }, { name: "TooltipContent" }] }],
    },
  ],
  features: [
    "TooltipContent always renders its own arrow — no separate TooltipArrow needs to be added, unlike Popover or DropdownMenu.",
    "Drop a Kbd inside TooltipContent to show a keyboard shortcut; it gets its own spacing and isolation styling automatically.",
  ],
  api: [
    {
      name: "TooltipProvider",
      description: "Wrap your app (or a region) once; shares timing across tooltips.",
      props: [
        {
          name: "delayDuration",
          type: "number",
          default: "0",
          description:
            "Milliseconds to hover before the tooltip opens — codefast overrides Radix's 700ms default to open instantly.",
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
