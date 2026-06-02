import type { ComponentDoc } from "#/components/examples/docs/types";
import { dialogBasicCode, dialogScrollCode } from "#/components/examples/codes";
import { DialogBasic } from "#/components/examples/docs/dialog/basic";
import { DialogScroll } from "#/components/examples/docs/dialog/scroll";

export const dialogDoc: ComponentDoc = {
  examples: [
    {
      id: "basic",
      title: "Basic",
      description: "A focus-trapped modal with header, body, and footer actions.",
      Demo: DialogBasic,
      code: dialogBasicCode,
      previewClassName: "min-h-40",
    },
    {
      id: "scrollable",
      title: "Scrollable body",
      description: "Keep the header and footer fixed while the body scrolls.",
      Demo: DialogScroll,
      code: dialogScrollCode,
      previewClassName: "min-h-40",
    },
  ],
  anatomy: `import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from "@codefast/ui/dialog";

<Dialog>
  <DialogTrigger asChild>…</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>…</DialogTitle>
      <DialogDescription>…</DialogDescription>
    </DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>
      <DialogClose>…</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
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
