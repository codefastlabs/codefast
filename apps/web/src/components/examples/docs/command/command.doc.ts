import { CommandDialogExample } from "#/components/examples/docs/command/dialog";
import { CommandPalette } from "#/components/examples/docs/command/palette";
import { CommandSimple } from "#/components/examples/docs/command/simple";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const commandDoc: ComponentDoc = {
  examples: [
    {
      id: "inline",
      title: "Inline palette",
      description: "Type to fuzzy-filter; pick an item to run it. The choice shows below.",
      Demo: CommandPalette,
      code: docSource("command", "palette"),
      previewClassName: "items-start",
    },
    {
      id: "dialog",
      title: "Command dialog",
      description: "The same palette in a modal — the most common ⌘K pattern.",
      Demo: CommandDialogExample,
      code: docSource("command", "dialog"),
      previewClassName: "min-h-40",
    },
    {
      id: "simple",
      title: "Minimal palette",
      description: "A single filterable group with no shortcuts.",
      Demo: CommandSimple,
      code: docSource("command", "simple"),
    },
  ],
  anatomy: docAnatomy("command"),
  api: [
    {
      name: "Command",
      description: "Built on cmdk. Filters items by the input as you type.",
      props: [
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "Control the highlighted item.",
        },
        {
          name: "shouldFilter",
          type: "boolean",
          default: "true",
          description: "Turn off built-in filtering to filter server-side.",
        },
      ],
    },
    {
      name: "CommandItem",
      props: [
        {
          name: "onSelect",
          type: "(value: string) => void",
          description: "Runs when the item is chosen by click or Enter.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Skip the item during filtering and keyboard nav.",
        },
      ],
    },
    {
      name: "CommandDialog",
      description: "Command inside a Dialog.",
      props: [
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Control the modal palette’s visibility.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Down"], description: "Highlights the next item." },
      { keys: ["Arrow", "Up"], description: "Highlights the previous item." },
      { keys: ["Enter"], description: "Runs the highlighted item." },
      { keys: ["Esc"], description: "Closes the command dialog." },
    ],
    notes: [
      "The input is a combobox controlling a listbox; highlighting is announced.",
      "Always provide a CommandEmpty so an empty search is communicated.",
      "Bind ⌘K / Ctrl+K to open the dialog in real apps — shown here as a hint only.",
    ],
  },
  guidelines: {
    do: [
      "Group commands and add a short heading per group.",
      "Show shortcuts with CommandShortcut so power users learn them.",
    ],
    dont: [
      "Don’t hide the only path to an action behind the palette.",
      "Don’t list hundreds of flat items without groups or search hints.",
    ],
  },
  related: ["dialog", "dropdown-menu", "select"],
};
