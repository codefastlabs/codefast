import { DrawerCart } from "#/components/examples/drawer.cart.example";
import { DrawerProfile } from "#/components/examples/drawer.profile.example";
import { DrawerSide } from "#/components/examples/drawer.side.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const drawerDoc: ComponentDoc = {
  examples: [
    {
      id: "profile",
      title: "Edit form",
      description: "A bottom sheet with drag-to-dismiss, holding a short form.",
      Demo: DrawerProfile,
      source: docSource("drawer", "profile"),
      previewClassName: "min-h-40",
    },
    {
      id: "cart",
      title: "Content drawer",
      description: "Hold a list, summary, or any rich content above the footer.",
      Demo: DrawerCart,
      source: docSource("drawer", "cart"),
    },
    {
      id: "side",
      title: "From the side",
      description: "Use the direction prop to slide in from an edge.",
      Demo: DrawerSide,
      source: docSource("drawer", "side"),
    },
  ],
  anatomy: docAnatomy("drawer"),
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
