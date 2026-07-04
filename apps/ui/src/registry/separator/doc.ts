import { SeparatorList } from "#/registry/separator/list.example";
import { SeparatorMenu } from "#/registry/separator/menu.example";
import { SeparatorRtl } from "#/registry/separator/rtl.example";
import { SeparatorVertical } from "#/registry/separator/vertical.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const separatorDoc: ComponentDoc = {
  examples: [
    {
      id: "separator-list",
      title: "List",
      description: "Horizontal separators between list items.",
      Demo: SeparatorList,
      source: docSource("separator", "list"),
    },
    {
      id: "separator-menu",
      title: "Menu",
      description: "Vertical separators between menu items with descriptions.",
      Demo: SeparatorMenu,
      source: docSource("separator", "menu"),
    },
    {
      id: "separator-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SeparatorRtl,
      source: docSource("separator", "rtl"),
      direction: "rtl",
    },
    {
      id: "separator-vertical",
      title: "Vertical",
      description: "Use orientation='vertical' for a vertical separator.",
      Demo: SeparatorVertical,
      source: docSource("separator", "vertical"),
    },
  ],
  anatomy: [{ name: "Separator" }, { name: "Separator" }],
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
