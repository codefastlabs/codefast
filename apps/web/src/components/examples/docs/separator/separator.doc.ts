import { SeparatorListSections } from "#/components/examples/docs/separator/list-sections";
import { SeparatorOrientations } from "#/components/examples/docs/separator/orientations";
import { SeparatorStats } from "#/components/examples/docs/separator/stats";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const separatorDoc: ComponentDoc = {
  examples: [
    {
      id: "orientations",
      title: "Horizontal & vertical",
      description: "Divide stacked blocks horizontally, or inline items vertically.",
      Demo: SeparatorOrientations,
      code: docSource("separator", "orientations"),
      previewClassName: "items-start",
    },
    {
      id: "list-sections",
      title: "Grouped list",
      description: "Separate the sections of a settings or navigation list.",
      Demo: SeparatorListSections,
      code: docSource("separator", "list-sections"),
      previewClassName: "items-start",
    },
    {
      id: "stats",
      title: "Vertical dividers",
      description: "Split inline stats with vertical rules of a fixed height.",
      Demo: SeparatorStats,
      code: docSource("separator", "stats"),
    },
  ],
  anatomy: docAnatomy("separator"),
  api: [
    {
      name: "Separator",
      description: "A semantic divider.",
      props: [
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Direction of the rule. Give vertical separators a height.",
        },
        {
          name: "decorative",
          type: "boolean",
          default: "false",
          description: "When true, it’s hidden from assistive tech (purely visual).",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Renders with role=separator so structure is announced.",
      "Set decorative when the line is purely visual and adds no meaning.",
      "Give vertical separators an explicit height (e.g. h-3).",
    ],
  },
  guidelines: {
    do: ["Use to group and separate related sections.", "Keep separators subtle — they organise, not decorate."],
    dont: [
      "Don’t overuse separators where spacing alone would do.",
      "Don’t forget a height on vertical separators, or they won’t show.",
    ],
  },
  related: ["card", "item", "scroll-area"],
};
