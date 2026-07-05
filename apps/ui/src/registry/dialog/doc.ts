import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { DialogCloseButton } from "#/registry/dialog/close-button.example";
import { DialogNoCloseButton } from "#/registry/dialog/no-close-button.example";
import { DialogRtl } from "#/registry/dialog/rtl.example";
import { DialogScrollableContent } from "#/registry/dialog/scrollable-content.example";
import { DialogStickyFooter } from "#/registry/dialog/sticky-footer.example";

export const dialogDoc: ComponentDoc = {
  usage: docUsage("dialog"),
  examples: [
    {
      id: "dialog-close-button",
      title: "Custom Close Button",
      description: "Replace the default close control with your own button.",
      Demo: DialogCloseButton,
      source: docSource("dialog", "close-button"),
    },
    {
      id: "dialog-no-close-button",
      title: "No Close Button",
      description: "Use showCloseButton={false} to hide the close button.",
      Demo: DialogNoCloseButton,
      source: docSource("dialog", "no-close-button"),
    },
    {
      id: "dialog-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: DialogRtl,
      source: docSource("dialog", "rtl"),
      direction: "rtl",
    },
    {
      id: "dialog-scrollable-content",
      title: "Scrollable Content",
      description: "Long content can scroll while the header stays in view.",
      Demo: DialogScrollableContent,
      source: docSource("dialog", "scrollable-content"),
    },
    {
      id: "dialog-sticky-footer",
      title: "Sticky Footer",
      description: "Keep actions visible while the content scrolls.",
      Demo: DialogStickyFooter,
      source: docSource("dialog", "sticky-footer"),
    },
  ],
  anatomy: [
    {
      name: "Dialog",
      children: [
        { name: "DialogTrigger" },
        {
          name: "DialogContent",
          children: [
            { name: "DialogHeader", children: [{ name: "DialogTitle" }, { name: "DialogDescription" }] },
            { name: "DialogBody" },
            { name: "DialogFooter", children: [{ name: "DialogClose" }] },
          ],
        },
      ],
    },
  ],
  features: [
    "DialogBody is a codefast addition over upstream Radix — long content scrolls on its own while DialogHeader/DialogFooter stay pinned, instead of the whole panel scrolling.",
    'DialogFooter\'s showCloseButton renders a ready-made "Close" button — no need to wire DialogClose asChild yourself.',
    "DialogContent's showCloseButton (default true) toggles the built-in corner × button.",
    "modal={false} lets content outside the dialog stay interactive instead of becoming inert.",
  ],
  api: [
    {
      name: "Dialog",
      description: "Root. Manages open state.",
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
          default: "true",
          description: "When true, content outside the dialog is inert.",
        },
      ],
    },
    {
      name: "DialogContent",
      description: "The panel. Traps focus and renders in a portal.",
      props: [
        {
          name: "onEscapeKeyDown",
          type: "(event) => void",
          description: "Intercept the Escape-to-close behaviour.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "When the trigger is focused, opens the dialog." },
      { keys: ["Enter"], description: "When the trigger is focused, opens the dialog." },
      { keys: ["Tab"], description: "Cycles focus within the dialog (focus is trapped)." },
      { keys: ["Shift", "Tab"], description: "Cycles focus backwards within the dialog." },
      { keys: ["Esc"], description: "Closes the dialog and restores focus to the trigger." },
    ],
    notes: [
      "Focus moves into the dialog on open and returns to the trigger on close.",
      "DialogTitle and DialogDescription are wired to aria-labelledby / aria-describedby.",
      "While open, the rest of the page is marked inert for assistive tech.",
    ],
  },
  guidelines: {
    do: [
      "Always include a DialogTitle, even if visually concise.",
      "Use a Dialog for focused tasks; use AlertDialog for destructive confirmations.",
    ],
    dont: [
      "Don’t stack multiple dialogs on top of one another.",
      "Don’t put long, primary content in a dialog — use a page or a sheet instead.",
    ],
  },
  related: ["alert-dialog", "sheet", "drawer", "popover"],
};
