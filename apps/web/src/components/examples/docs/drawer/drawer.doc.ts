import type { ComponentDoc } from "#/components/examples/docs/types";
import { drawerAnatomyCode, drawerProfileCode } from "#/components/examples/codes";
import { DrawerProfile } from "#/components/examples/docs/drawer/profile";

export const drawerDoc: ComponentDoc = {
  examples: [
    {
      id: "profile",
      title: "Edit form",
      description: "A bottom sheet with drag-to-dismiss, holding a short form.",
      Demo: DrawerProfile,
      code: drawerProfileCode,
      previewClassName: "min-h-40",
    },
  ],
  anatomy: drawerAnatomyCode,
  api: [
    {
      name: "Drawer",
      description: "Root. A bottom sheet built on Vaul with gesture support.",
      props: [
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Control visibility from your own state.",
        },
        {
          name: "shouldScaleBackground",
          type: "boolean",
          default: "true",
          description: "Scale the page behind the drawer as it opens.",
        },
      ],
    },
    {
      name: "DrawerContent / DrawerClose",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The panel content; DrawerClose dismisses the drawer.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Cycles focus within the drawer (trapped)." },
      { keys: ["Esc"], description: "Closes the drawer." },
    ],
    notes: [
      "Supports drag-to-dismiss on touch, with a keyboard path to close too.",
      "Always provide a DrawerTitle for an accessible name.",
      "On desktop, a Sheet or Dialog is often a better fit than a bottom drawer.",
    ],
  },
  guidelines: {
    do: [
      "Use on mobile for quick, focused tasks reachable by thumb.",
      "Keep content short so the drawer doesn’t fill the screen.",
    ],
    dont: [
      "Don’t put long, multi-step flows in a drawer.",
      "Don’t use a drawer where a Dialog reads better on desktop.",
    ],
  },
  related: ["sheet", "dialog", "popover"],
};
