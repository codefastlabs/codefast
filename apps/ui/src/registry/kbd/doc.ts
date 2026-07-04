import { KbdButton } from "#/registry/kbd/button.example";
import { KbdDemo } from "#/registry/kbd/demo";
import { KbdGroupExample } from "#/registry/kbd/group.example";
import { KbdInputGroup } from "#/registry/kbd/input-group.example";
import { KbdRtl } from "#/registry/kbd/rtl.example";
import { KbdTooltip } from "#/registry/kbd/tooltip.example";
import { docAnatomy, docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const kbdDoc: ComponentDoc = {
  examples: [
    {
      id: "kbd-demo",
      title: "Demo",
      description: "Compose modifier keys with KbdGroup to display keyboard shortcuts.",
      Demo: KbdDemo,
      source: docDemo("kbd"),
    },
    {
      id: "kbd-button",
      title: "Button",
      description: "Use the Kbd component inside a Button component to display a keyboard key inside a button.",
      Demo: KbdButton,
      source: docSource("kbd", "button"),
    },
    {
      id: "kbd-group",
      title: "Group",
      description: "Use the KbdGroup component to group keyboard keys together.",
      Demo: KbdGroupExample,
      source: docSource("kbd", "group"),
    },
    {
      id: "kbd-input-group",
      title: "Input Group",
      description:
        "You can use the Kbd component inside a InputGroupAddon component to display a keyboard key inside an input group.",
      Demo: KbdInputGroup,
      source: docSource("kbd", "input-group"),
    },
    {
      id: "kbd-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: KbdRtl,
      source: docSource("kbd", "rtl"),
      direction: "rtl",
    },
    {
      id: "kbd-tooltip",
      title: "Tooltip",
      description: "You can use the Kbd component inside a Tooltip component to display a tooltip with a keyboard key.",
      Demo: KbdTooltip,
      source: docSource("kbd", "tooltip"),
    },
  ],
  anatomy: docAnatomy("kbd"),
  api: [
    {
      name: "Kbd",
      description: "A single keyboard key.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The key label, e.g. ⌘, Ctrl, Enter.",
        },
      ],
    },
    {
      name: "KbdGroup",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Several Kbd elements that form one shortcut.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Kbd is presentational — it doesn’t bind any keyboard behaviour itself.",
      "Use real key names so the shortcut reads correctly to everyone.",
      "Match the symbols to the user’s platform (⌘ on macOS, Ctrl elsewhere) when you can.",
    ],
  },
  guidelines: {
    do: ["Use to document shortcuts in menus, tooltips, and help text.", "Group multi-key combos with KbdGroup."],
    dont: ["Don’t use Kbd for non-keyboard content.", "Don’t invent symbols users won’t recognise."],
  },
  related: ["tooltip", "command", "badge"],
};
