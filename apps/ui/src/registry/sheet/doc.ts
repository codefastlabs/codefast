import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { SheetNoCloseButton } from "#/registry/sheet/no-close-button.example";
import { SheetRtl } from "#/registry/sheet/rtl.example";
import { SheetSide } from "#/registry/sheet/side.example";

export const sheetDoc: ComponentDoc = {
  usage: docUsage("sheet"),
  examples: [
    {
      id: "sheet-no-close-button",
      title: "No Close Button",
      description: "Use showCloseButton={false} on SheetContent to hide the close button.",
      Demo: SheetNoCloseButton,
      source: docSource("sheet", "no-close-button"),
    },
    {
      id: "sheet-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SheetRtl,
      source: docSource("sheet", "rtl"),
      direction: "rtl",
    },
    {
      id: "sheet-side",
      title: "Side",
      description:
        "Use the side prop on SheetContent to set the edge of the screen where the sheet appears. Values are top, right, bottom, or left.",
      Demo: SheetSide,
      source: docSource("sheet", "side"),
    },
  ],
  anatomy: [
    {
      name: "Sheet",
      children: [
        { name: "SheetTrigger" },
        {
          name: "SheetContent",
          children: [
            { name: "SheetHeader", children: [{ name: "SheetTitle" }, { name: "SheetDescription" }] },
            { name: "SheetBody" },
            { name: "SheetFooter", children: [{ name: "SheetClose" }] },
          ],
        },
      ],
    },
  ],
  features: [
    "SheetBody is a codefast addition over upstream Radix — long content scrolls on its own while Header/Footer stay pinned, same as DialogBody.",
    'Four slide-in edges via side ("top" | "right" | "bottom" | "left", default "right").',
    "Built on Dialog under the hood — inherits its focus trap and inert-background behaviour.",
  ],
  api: [
    {
      name: "Sheet",
      description: "Root. Manages open state (a Dialog under the hood).",
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
      ],
    },
    {
      name: "SheetContent",
      props: [
        {
          name: "side",
          type: '"top" | "right" | "bottom" | "left"',
          default: '"right"',
          description: "Which edge the panel slides in from.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the sheet when the trigger is focused." },
      { keys: ["Tab"], description: "Cycles focus within the sheet (focus is trapped)." },
      { keys: ["Esc"], description: "Closes the sheet and restores focus to the trigger." },
    ],
    notes: [
      "A Sheet is a Dialog: focus is trapped and the background is inert while open.",
      "Always provide a SheetTitle so the panel has an accessible name.",
      "Use a Sheet for side tasks; use a Drawer (Vaul) for mobile bottom-sheet gestures.",
    ],
  },
  guidelines: {
    do: [
      "Use for secondary tasks — filters, details, quick edits.",
      "Anchor navigation sheets to the left, content/detail sheets to the right.",
    ],
    dont: ["Don’t put a multi-step primary flow in a sheet — use a page.", "Don’t stack a sheet over a dialog."],
  },
  related: ["dialog", "drawer", "popover"],
};
