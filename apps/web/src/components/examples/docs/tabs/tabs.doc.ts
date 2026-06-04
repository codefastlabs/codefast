import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { TabsDefault } from "#/components/examples/docs/tabs/default";
import { TabsLine } from "#/components/examples/docs/tabs/line";

export const tabsDoc: ComponentDoc = {
  examples: [
    {
      id: "default",
      title: "Default",
      description: "The solid pill style, ideal for settings panels.",
      Demo: TabsDefault,
      code: docSource("tabs", "default"),
    },
    {
      id: "line",
      title: "Line variant",
      description: "An underline style for content-level navigation.",
      Demo: TabsLine,
      code: docSource("tabs", "line"),
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
    dont: [
      "Don’t nest tabs more than one level deep.",
      "Don’t hide critical actions behind a non-default tab.",
    ],
  },
  related: ["navigation-menu", "menubar", "accordion"],
};
