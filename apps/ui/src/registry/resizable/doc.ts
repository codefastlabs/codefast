import { ResizableDemo } from "#/registry/resizable/demo";
import { ResizableSeparatorDemo } from "#/registry/resizable/handle.example";
import { ResizableRtl } from "#/registry/resizable/rtl.example";
import { ResizableVertical } from "#/registry/resizable/vertical.example";
import { docDemo, docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const resizableDoc: ComponentDoc = {
  usage: docUsage("resizable"),
  examples: [
    {
      id: "resizable-demo",
      title: "Demo",
      description: "Nested horizontal and vertical panels resized from a single group.",
      Demo: ResizableDemo,
      source: docDemo("resizable"),
      previewClassName: "block",
    },
    {
      id: "resizable-vertical",
      title: "Vertical split",
      description: "Stack panels and resize along the vertical axis.",
      Demo: ResizableVertical,
      source: docSource("resizable", "vertical"),
    },
    {
      id: "resizable-handle",
      title: "Handle",
      description: "Use the withHandle prop on ResizableSeparator to show a visible handle.",
      Demo: ResizableSeparatorDemo,
      source: docSource("resizable", "handle"),
      previewClassName: "block",
    },
    {
      id: "resizable-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ResizableRtl,
      source: docSource("resizable", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "ResizableGroup",
      children: [{ name: "ResizablePanel" }, { name: "ResizableSeparator" }, { name: "ResizablePanel" }],
    },
  ],
  features: [
    "Built on react-resizable-panels — defaultSize/minSize/maxSize are percentages of the group, not pixels.",
    "withHandle on ResizableSeparator adds a small visible grip in the middle of the drag handle.",
    "Nest a ResizableGroup inside a ResizablePanel to combine horizontal and vertical splits in one layout.",
  ],
  api: [
    {
      name: "ResizableGroup",
      description: "A row or column of resizable panels.",
      props: [
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Axis the panels are laid along.",
        },
      ],
    },
    {
      name: "ResizablePanel",
      props: [
        {
          name: "defaultSize / minSize / maxSize",
          type: "number (percent)",
          description: "Initial and bounded size of the panel.",
        },
      ],
    },
    {
      name: "ResizableSeparator",
      props: [
        {
          name: "—",
          type: "—",
          description: "The draggable handle placed between two panels.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to a separator handle." },
      { keys: ["Arrow", "Left"], description: "Resizes the panels by a step." },
      { keys: ["Arrow", "Right"], description: "Resizes the panels by a step." },
    ],
    notes: [
      "Each handle is a focusable separator with aria-valuenow for its position.",
      "Set sensible minSize so panels can’t collapse to nothing by accident.",
      "Provide a non-drag fallback layout on touch where resizing is awkward.",
    ],
  },
  guidelines: {
    do: ["Use for app shells — sidebars, editors, split views.", "Set min/max sizes to keep panels usable."],
    dont: [
      "Don’t use for simple content that doesn’t need resizing.",
      "Don’t allow a panel to shrink below a readable size.",
    ],
  },
  related: ["scroll-area", "sidebar", "separator"],
};
