import { docSource, docAnatomy } from "#/components/examples/source";
import { TabsDefault } from "#/components/examples/tabs.default";
import { TabsLine } from "#/components/examples/tabs.line";
import { TabsWithIcons } from "#/components/examples/tabs.with-icons";
import type { ComponentDoc } from "#/components/examples/types";

export const tabsDoc: ComponentDoc = {
  examples: [
    {
      id: "default",
      title: "Default",
      description: "The solid pill style, ideal for settings panels.",
      Demo: TabsDefault,
      source: docSource("tabs", "default"),
    },
    {
      id: "line",
      title: "Line variant",
      description: "An underline style for content-level navigation.",
      Demo: TabsLine,
      source: docSource("tabs", "line"),
    },
    {
      id: "with-icons",
      title: "With icons",
      description: "Add an icon before each tab label.",
      Demo: TabsWithIcons,
      source: docSource("tabs", "with-icons"),
    },
  ],
  anatomy: docAnatomy("tabs"),
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
