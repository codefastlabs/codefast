import { SeparatorList } from "#/registry/separator/list.example";
import { SeparatorMenu } from "#/registry/separator/menu.example";
import { SeparatorRtl } from "#/registry/separator/rtl.example";
import { SeparatorVertical } from "#/registry/separator/vertical.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const separatorDoc: ComponentDoc = {
  usage: docUsage("separator"),
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
  anatomy: [{ name: "Separator" }],
  features: [
    "decorative defaults to true (hidden from assistive tech) — set it to false when the divider carries real document structure that should be announced.",
    'align positions a SeparatorItem (e.g. an "OR" label) centered on the rule.',
  ],
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
          default: "true",
          description: "When true, it’s hidden from assistive tech (purely visual).",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Decorative by default — no role, hidden from assistive tech. Set decorative={false} to expose role=separator when the divider carries real structure.",
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
