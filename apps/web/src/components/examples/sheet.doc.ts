import { SheetNavigation } from "#/components/examples/sheet.navigation.example";
import { SheetProfile } from "#/components/examples/sheet.profile.example";
import { SheetSides } from "#/components/examples/sheet.sides.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const sheetDoc: ComponentDoc = {
  examples: [
    {
      id: "sides",
      title: "Any edge",
      description: "Controlled open state plus a side prop — slide in from top, right, bottom, or left.",
      Demo: SheetSides,
      source: docSource("sheet", "sides"),
      previewClassName: "min-h-40",
    },
    {
      id: "form",
      title: "Edit form",
      description: "A trigger-driven sheet holding a short form with header, body, and footer actions.",
      Demo: SheetProfile,
      source: docSource("sheet", "profile"),
      previewClassName: "min-h-40",
    },
    {
      id: "navigation",
      title: "Side navigation",
      description: "A left-anchored sheet as a mobile nav menu.",
      Demo: SheetNavigation,
      source: docSource("sheet", "navigation"),
    },
  ],
  anatomy: docAnatomy("sheet"),
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
