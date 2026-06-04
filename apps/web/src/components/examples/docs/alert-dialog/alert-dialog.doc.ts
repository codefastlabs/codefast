import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { AlertDialogConfirm } from "#/components/examples/docs/alert-dialog/confirm";

export const alertDialogDoc: ComponentDoc = {
  examples: [
    {
      id: "confirm",
      title: "Destructive confirm",
      description: "A blocking modal that forces an explicit Cancel or confirm decision.",
      Demo: AlertDialogConfirm,
      code: docSource("alert-dialog", "confirm"),
      previewClassName: "min-h-40",
    },
  ],
  anatomy: docAnatomy("alert-dialog"),
  api: [
    {
      name: "AlertDialog",
      description: "Root. A modal that traps focus and requires an explicit choice.",
      props: [
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Control visibility from your own state.",
        },
      ],
    },
    {
      name: "AlertDialogAction / AlertDialogCancel",
      props: [
        {
          name: "onClick",
          type: "(event) => void",
          description: "Action confirms; Cancel dismisses. Both close the dialog.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Cycles focus within the dialog (trapped)." },
      { keys: ["Esc"], description: "Triggers Cancel and closes the dialog." },
    ],
    notes: [
      "Focus moves to the dialog on open; Cancel is the default focus target.",
      "Title and description are wired to aria-labelledby / aria-describedby.",
      "Unlike Dialog, it must not be dismissed by clicking the backdrop.",
    ],
  },
  guidelines: {
    do: [
      "Use for irreversible or risky actions (delete, sign out everywhere).",
      "Label the action with the verb, e.g. “Delete”, not “OK”.",
    ],
    dont: [
      "Don’t use for routine, reversible tasks — that’s a Dialog.",
      "Don’t make Cancel and the destructive action look identical.",
    ],
  },
  related: ["dialog", "alert", "sheet"],
};
