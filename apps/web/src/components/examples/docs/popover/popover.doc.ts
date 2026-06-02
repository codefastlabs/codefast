import type { ComponentDoc } from "#/components/examples/docs/types";
import { popoverDimensionsCode, popoverShareCode } from "#/components/examples/codes";
import { PopoverDimensions } from "#/components/examples/docs/popover/dimensions";
import { PopoverShare } from "#/components/examples/docs/popover/share";

export const popoverDoc: ComponentDoc = {
  examples: [
    {
      id: "share",
      title: "Share link",
      description: "A working copy-to-clipboard panel — interactive, with a confirmation state.",
      Demo: PopoverShare,
      code: popoverShareCode,
      previewClassName: "min-h-40",
    },
    {
      id: "dimensions",
      title: "Settings form",
      description: "A non-modal panel of inputs anchored to its trigger — ideal for quick edits.",
      Demo: PopoverDimensions,
      code: popoverDimensionsCode,
      previewClassName: "min-h-40",
    },
  ],
  anatomy: `import {
  Popover, PopoverTrigger, PopoverContent,
  PopoverHeader, PopoverTitle, PopoverDescription,
} from "@codefast/ui/popover";

<Popover>
  <PopoverTrigger asChild>…</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>…</PopoverTitle>
    </PopoverHeader>
    …
  </PopoverContent>
</Popover>`,
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
