import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { SeparatorOrientations } from "#/components/examples/docs/separator/orientations";

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
    do: [
      "Use to group and separate related sections.",
      "Keep separators subtle — they organise, not decorate.",
    ],
    dont: [
      "Don’t overuse separators where spacing alone would do.",
      "Don’t forget a height on vertical separators, or they won’t show.",
    ],
  },
  related: ["card", "item", "scroll-area"],
};
