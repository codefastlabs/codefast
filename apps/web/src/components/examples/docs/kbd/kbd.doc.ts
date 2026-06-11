import { KbdInButton } from "#/components/examples/docs/kbd/in-button";
import { KbdInline } from "#/components/examples/docs/kbd/inline";
import { KbdShortcuts } from "#/components/examples/docs/kbd/shortcuts";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const kbdDoc: ComponentDoc = {
  examples: [
    {
      id: "shortcuts",
      title: "Key combinations",
      description: "Compose multi-key shortcuts with KbdGroup; use a lone Kbd for single keys.",
      Demo: KbdShortcuts,
      source: docSource("kbd", "shortcuts"),
    },
    {
      id: "inline",
      title: "Inline in text",
      description: "Kbd flows inline, so you can reference shortcuts mid-sentence.",
      Demo: KbdInline,
      source: docSource("kbd", "inline"),
    },
    {
      id: "in-button",
      title: "Inside controls",
      description: "Pair a shortcut hint with the action it triggers.",
      Demo: KbdInButton,
      source: docSource("kbd", "in-button"),
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
