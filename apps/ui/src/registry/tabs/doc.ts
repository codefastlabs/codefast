import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { TabsDisabled } from "#/registry/tabs/disabled.example";
import { TabsIcons } from "#/registry/tabs/icons.example";
import { TabsLine } from "#/registry/tabs/line.example";
import { TabsRtl } from "#/registry/tabs/rtl.example";
import { TabsVertical } from "#/registry/tabs/vertical.example";

export const tabsDoc: ComponentDoc = {
  usage: docUsage("tabs"),
  examples: [
    {
      id: "line",
      title: "Line variant",
      description: "An underline style for content-level navigation.",
      Demo: TabsLine,
      source: docSource("tabs", "line"),
    },
    {
      id: "tabs-disabled",
      title: "Disabled",
      description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
      Demo: TabsDisabled,
      source: docSource("tabs", "disabled"),
    },
    {
      id: "tabs-icons",
      title: "Icons",
      description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
      Demo: TabsIcons,
      source: docSource("tabs", "icons"),
    },
    {
      id: "tabs-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: TabsRtl,
      source: docSource("tabs", "rtl"),
      direction: "rtl",
    },
    {
      id: "tabs-vertical",
      title: "Vertical",
      description: "Use orientation='vertical' for vertical tabs.",
      Demo: TabsVertical,
      source: docSource("tabs", "vertical"),
    },
  ],
  anatomy: [
    { name: "Tabs", children: [{ name: "TabsList", children: [{ name: "TabsTrigger" }] }, { name: "TabsContent" }] },
  ],
  features: [
    "Two TabsList variants — default (solid pill) and line (underline) — set independently of the Tabs root.",
    'orientation="vertical" stacks the list and switches keyboard nav to Up/Down.',
    'activationMode="manual" requires Enter/Space to activate a focused tab instead of switching on arrow-key focus alone.',
  ],
  api: [
    {
      name: "Tabs",
      description: "Root. Controls which panel is active.",
      props: [
        {
          name: "defaultValue",
          type: "string",
          description: "The tab selected on mount (uncontrolled).",
        },
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "Control the active tab from your own state.",
        },
        {
          name: "activationMode",
          type: '"automatic" | "manual"',
          default: '"automatic"',
          description: "Whether focusing a tab activates it, or only on click/Enter.",
        },
      ],
    },
    {
      name: "TabsList",
      props: [
        {
          name: "variant",
          type: '"default" | "line"',
          default: '"default"',
          description: "Solid pill list, or an underline list.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus into the active tab, then to the panel." },
      { keys: ["Arrow", "Left"], description: "Moves to the previous tab." },
      { keys: ["Arrow", "Right"], description: "Moves to the next tab." },
      { keys: ["Home"], description: "Moves to the first tab." },
      { keys: ["End"], description: "Moves to the last tab." },
    ],
    notes: [
      "Implements the WAI-ARIA Tabs pattern with roving tabindex.",
      "Each TabsTrigger is wired to its TabsContent via aria-controls automatically.",
    ],
  },
  guidelines: {
    do: [
      "Keep tab labels to one or two words.",
      "Use tabs for peer views of the same context, not for a multi-step flow.",
    ],
    dont: ["Don’t nest tabs more than one level deep.", "Don’t hide critical actions behind a non-default tab."],
  },
  related: ["navigation-menu", "menubar", "accordion"],
};
