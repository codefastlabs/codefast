import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { KbdInline } from "#/components/examples/docs/kbd/inline";
import { KbdShortcuts } from "#/components/examples/docs/kbd/shortcuts";

export const kbdDoc: ComponentDoc = {
  examples: [
    {
      id: "shortcuts",
      title: "Key combinations",
      description: "Compose multi-key shortcuts with KbdGroup; use a lone Kbd for single keys.",
      Demo: KbdShortcuts,
      code: docSource("kbd", "shortcuts"),
    },
    {
      id: "inline",
      title: "Inline in text",
      description: "Kbd flows inline, so you can reference shortcuts mid-sentence.",
      Demo: KbdInline,
      code: docSource("kbd", "inline"),
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
    do: [
      "Use to document shortcuts in menus, tooltips, and help text.",
      "Group multi-key combos with KbdGroup.",
    ],
    dont: [
      "Don’t use Kbd for non-keyboard content.",
      "Don’t invent symbols users won’t recognise.",
    ],
  },
  related: ["tooltip", "command", "badge"],
};
