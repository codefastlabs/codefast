import { ScrollAreaHorizontalDemo } from "#/registry/scroll-area/horizontal-demo.example";
import { ScrollAreaRtl } from "#/registry/scroll-area/rtl.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const scrollAreaDoc: ComponentDoc = {
  examples: [
    {
      id: "scroll-area-horizontal-demo",
      title: "Horizontal",
      description: "Use ScrollBar with orientation='horizontal' for horizontal scrolling.",
      Demo: ScrollAreaHorizontalDemo,
      source: docSource("scroll-area", "horizontal-demo"),
    },
    {
      id: "scroll-area-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ScrollAreaRtl,
      source: docSource("scroll-area", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "ScrollArea" }],
  api: [
    {
      name: "ScrollArea",
      description: "A viewport with a styled scrollbar that replaces the native one.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Set the fixed size (e.g. h-44 w-48) the content scrolls within.",
        },
      ],
    },
    {
      name: "ScrollAreaScrollbar",
      props: [
        {
          name: "orientation",
          type: '"vertical" | "horizontal"',
          description: "Render a horizontal scrollbar in addition to the vertical one.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "The viewport stays keyboard-scrollable and focusable as normal.",
      "Custom scrollbars are visual; native scroll behaviour is preserved underneath.",
      "Ensure content has enough contrast against the scroll surface.",
    ],
  },
  guidelines: {
    do: [
      "Use for constrained lists, menus, and panels.",
      "Give the area a clear fixed size so the scrollbar makes sense.",
    ],
    dont: [
      "Don’t wrap the whole page — let it scroll natively.",
      "Don’t hide that content is scrollable; show a peek of the next row.",
    ],
  },
  related: ["resizable", "separator", "command"],
};
