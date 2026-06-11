import { AlertDialogBasic } from "#/components/examples/docs/alert-dialog/alert-dialog-basic";
import { AlertDialogDemo } from "#/components/examples/docs/alert-dialog/alert-dialog-demo";
import { AlertDialogDestructive } from "#/components/examples/docs/alert-dialog/alert-dialog-destructive";
import { AlertDialogWithMedia } from "#/components/examples/docs/alert-dialog/alert-dialog-media";
import { AlertDialogRtl } from "#/components/examples/docs/alert-dialog/alert-dialog-rtl";
import { AlertDialogSmall } from "#/components/examples/docs/alert-dialog/alert-dialog-small";
import { AlertDialogSmallWithMedia } from "#/components/examples/docs/alert-dialog/alert-dialog-small-media";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const alertDialogDoc: ComponentDoc = {
  examples: [
    {
      id: "alert-dialog-demo",
      title: "Demo",
      description: "A blocking modal that forces an explicit Cancel or confirm decision.",
      Demo: AlertDialogDemo,
      code: docSource("alert-dialog", "alert-dialog-demo"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-basic",
      title: "Basic",
      description: "A basic alert dialog with a header, description, and confirm/cancel actions.",
      Demo: AlertDialogBasic,
      code: docSource("alert-dialog", "alert-dialog-basic"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-small",
      title: "Small",
      description: "Use size=sm for a compact, centered confirmation.",
      Demo: AlertDialogSmall,
      code: docSource("alert-dialog", "alert-dialog-small"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-media",
      title: "Media",
      description: "Lead the header with an AlertDialogMedia icon for visual emphasis.",
      Demo: AlertDialogWithMedia,
      code: docSource("alert-dialog", "alert-dialog-media"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-small-media",
      title: "Small with media",
      description: "Combine the compact size with a media icon.",
      Demo: AlertDialogSmallWithMedia,
      code: docSource("alert-dialog", "alert-dialog-small-media"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-destructive",
      title: "Destructive",
      description: "Pair a destructive media icon with a destructive action button.",
      Demo: AlertDialogDestructive,
      code: docSource("alert-dialog", "alert-dialog-destructive"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AlertDialogRtl,
      code: docSource("alert-dialog", "alert-dialog-rtl"),
      previewClassName: "min-h-40",
      direction: "rtl",
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
