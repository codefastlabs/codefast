import { ScrollAreaHorizontal } from "#/registry/scroll-area/horizontal.example";
import { ScrollAreaList } from "#/registry/scroll-area/list.example";
import { ScrollAreaProse } from "#/registry/scroll-area/prose.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const scrollAreaDoc: ComponentDoc = {
  examples: [
    {
      id: "list",
      title: "Scrollable list",
      description: "A fixed-height region with a custom, design-system scrollbar.",
      Demo: ScrollAreaList,
      source: docSource("scroll-area", "list"),
    },
    {
      id: "horizontal",
      title: "Horizontal scroll",
      description: "Scroll a wide row of cards along the x-axis.",
      Demo: ScrollAreaHorizontal,
      source: docSource("scroll-area", "horizontal"),
    },
    {
      id: "prose",
      title: "Long-form text",
      description: "Contain lengthy terms or release notes in a fixed box.",
      Demo: ScrollAreaProse,
      source: docSource("scroll-area", "prose"),
    },
  ],
  anatomy: docAnatomy("scroll-area"),
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
