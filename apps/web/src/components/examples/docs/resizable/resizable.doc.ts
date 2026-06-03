import type { ComponentDoc } from "#/components/examples/docs/types";
import { resizableAnatomyCode, resizablePanelsCode } from "#/components/examples/codes";
import { ResizablePanels } from "#/components/examples/docs/resizable/panels";

export const resizableDoc: ComponentDoc = {
  examples: [
    {
      id: "panels",
      title: "Nested panels",
      description: "Drag the handles to resize — groups nest horizontally and vertically.",
      Demo: ResizablePanels,
      code: resizablePanelsCode,
    },
  ],
  anatomy: resizableAnatomyCode,
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
    do: [
      "Use for app shells — sidebars, editors, split views.",
      "Set min/max sizes to keep panels usable.",
    ],
    dont: [
      "Don’t use for simple content that doesn’t need resizing.",
      "Don’t allow a panel to shrink below a readable size.",
    ],
  },
  related: ["scroll-area", "sidebar", "separator"],
};
