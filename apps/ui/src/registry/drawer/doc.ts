import { DrawerDemo } from "#/registry/drawer/demo.example";
import { DrawerDialogDemo } from "#/registry/drawer/dialog.example";
import { DrawerRtl } from "#/registry/drawer/rtl.example";
import { DrawerScrollableContent } from "#/registry/drawer/scrollable-content.example";
import { DrawerWithSides } from "#/registry/drawer/sides.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const drawerDoc: ComponentDoc = {
  examples: [
    {
      id: "drawer-demo",
      title: "Goal Adjuster",
      description: "A bottom drawer that steps a numeric goal up and down, with a chart summary.",
      Demo: DrawerDemo,
      source: docSource("drawer", "demo"),
    },
    {
      id: "drawer-dialog",
      title: "Responsive Dialog",
      description:
        "You can combine the Dialog and Drawer components to create a responsive dialog. This renders a Dialog component on desktop and a Drawer on mobile.",
      Demo: DrawerDialogDemo,
      source: docSource("drawer", "dialog"),
    },
    {
      id: "drawer-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: DrawerRtl,
      source: docSource("drawer", "rtl"),
      direction: "rtl",
    },
    {
      id: "drawer-scrollable-content",
      title: "Scrollable Content",
      description: "Keep actions visible while the content scrolls.",
      Demo: DrawerScrollableContent,
      source: docSource("drawer", "scrollable-content"),
    },
    {
      id: "drawer-sides",
      title: "Sides",
      description:
        "Use the direction prop to set the side of the drawer. Available options are top, right, bottom, and left.",
      Demo: DrawerWithSides,
      source: docSource("drawer", "sides"),
    },
  ],
  anatomy: [
    {
      name: "Drawer",
      children: [
        { name: "DrawerTrigger" },
        {
          name: "DrawerContent",
          children: [
            { name: "DrawerHeader", children: [{ name: "DrawerTitle" }, { name: "DrawerDescription" }] },
            { name: "DrawerFooter", children: [{ name: "DrawerClose" }] },
          ],
        },
      ],
    },
  ],
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
