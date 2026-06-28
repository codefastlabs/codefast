import { AlertDialogBasic } from "#/registry/alert-dialog/basic.example";
import { AlertDialogDemo } from "#/registry/alert-dialog/demo";
import { AlertDialogDestructive } from "#/registry/alert-dialog/destructive.example";
import { AlertDialogWithMedia } from "#/registry/alert-dialog/media.example";
import { AlertDialogRtl } from "#/registry/alert-dialog/rtl.example";
import { AlertDialogSmallWithMedia } from "#/registry/alert-dialog/small-media.example";
import { AlertDialogSmall } from "#/registry/alert-dialog/small.example";
import { docAnatomy, docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const alertDialogDoc: ComponentDoc = {
  examples: [
    {
      id: "alert-dialog-demo",
      title: "Demo",
      description: "A blocking modal that forces an explicit Cancel or confirm decision.",
      Demo: AlertDialogDemo,
      source: docDemo("alert-dialog"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-basic",
      title: "Basic",
      description: "A basic alert dialog with a header, description, and confirm/cancel actions.",
      Demo: AlertDialogBasic,
      source: docSource("alert-dialog", "basic"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-small",
      title: "Small",
      description: "Use size=sm for a compact, centered confirmation.",
      Demo: AlertDialogSmall,
      source: docSource("alert-dialog", "small"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-media",
      title: "Media",
      description: "Lead the header with an AlertDialogMedia icon for visual emphasis.",
      Demo: AlertDialogWithMedia,
      source: docSource("alert-dialog", "media"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-small-media",
      title: "Small with media",
      description: "Combine the compact size with a media icon.",
      Demo: AlertDialogSmallWithMedia,
      source: docSource("alert-dialog", "small-media"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-destructive",
      title: "Destructive",
      description: "Pair a destructive media icon with a destructive action button.",
      Demo: AlertDialogDestructive,
      source: docSource("alert-dialog", "destructive"),
      previewClassName: "min-h-40",
    },
    {
      id: "alert-dialog-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AlertDialogRtl,
      source: docSource("alert-dialog", "rtl"),
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
