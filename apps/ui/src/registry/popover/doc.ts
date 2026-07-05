import { PopoverAlignments } from "#/registry/popover/alignments.example";
import { PopoverBasic } from "#/registry/popover/basic.example";
import { PopoverForm } from "#/registry/popover/form.example";
import { PopoverRtl } from "#/registry/popover/rtl.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const popoverDoc: ComponentDoc = {
  examples: [
    {
      id: "popover-alignments",
      title: "Align",
      description: "Use the align prop on PopoverContent to control the horizontal alignment.",
      Demo: PopoverAlignments,
      source: docSource("popover", "alignments"),
    },
    {
      id: "popover-basic",
      title: "Basic",
      description: "A simple popover with a header, title, and description.",
      Demo: PopoverBasic,
      source: docSource("popover", "basic"),
    },
    {
      id: "popover-form",
      title: "With Form",
      description: "A popover with form fields inside.",
      Demo: PopoverForm,
      source: docSource("popover", "form"),
    },
    {
      id: "popover-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: PopoverRtl,
      source: docSource("popover", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "Popover",
      children: [
        { name: "PopoverTrigger" },
        { name: "PopoverContent", children: [{ name: "PopoverHeader", children: [{ name: "PopoverTitle" }] }] },
      ],
    },
  ],
  features: [
    "Non-modal by default — the rest of the page stays interactive while it's open; set modal to trap focus like a Dialog.",
    "PopoverAnchor lets the panel point at a different element than the one that opens it.",
    "side/align/sideOffset on PopoverContent control placement and the gap from the trigger.",
  ],
  api: [
    {
      name: "Popover",
      description: "Root. Manages open state. Non-modal by default.",
      props: [
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Control visibility from your own state.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Open on mount when uncontrolled.",
        },
        {
          name: "modal",
          type: "boolean",
          default: "false",
          description: "When true, traps focus and blocks outside interaction.",
        },
      ],
    },
    {
      name: "PopoverContent",
      props: [
        {
          name: "side / align",
          type: '"top"|"right"|"bottom"|"left" / "start"|"center"|"end"',
          default: '"bottom" / "center"',
          description: "Placement relative to the trigger.",
        },
        {
          name: "sideOffset",
          type: "number",
          default: "4",
          description: "Gap in px between trigger and content.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the popover when the trigger is focused." },
      { keys: ["Tab"], description: "Moves through focusable elements inside the content." },
      { keys: ["Esc"], description: "Closes the popover and returns focus to the trigger." },
    ],
    notes: [
      "Focus moves into the content on open and returns to the trigger on close.",
      "Unlike a Dialog it is non-modal — the rest of the page stays interactive unless modal is set.",
      "Use a Tooltip for hover hints; reach for a Popover when the panel holds controls.",
    ],
  },
  guidelines: {
    do: [
      "Anchor short, focused tasks to the control they relate to.",
      "Give the panel a title with PopoverTitle when it contains a form.",
    ],
    dont: [
      "Don’t put long, primary content in a popover — use a Dialog or a page.",
      "Don’t use a Popover for passive hints — that’s a Tooltip.",
    ],
  },
  related: ["tooltip", "hover-card", "dropdown-menu", "dialog"],
};
