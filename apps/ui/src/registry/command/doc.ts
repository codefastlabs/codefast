import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { CommandBasic } from "#/registry/command/basic.example";
import { CommandDialogDemo } from "#/registry/command/dialog.example";
import { CommandWithGroups } from "#/registry/command/groups.example";
import { CommandRtl } from "#/registry/command/rtl.example";
import { CommandManyItems } from "#/registry/command/scrollable.example";
import { CommandWithShortcuts } from "#/registry/command/shortcuts.example";

export const commandDoc: ComponentDoc = {
  examples: [
    {
      id: "command-dialog",
      title: "Command dialog",
      description: "The same palette in a modal — the most common ⌘K pattern.",
      Demo: CommandDialogDemo,
      source: docSource("command", "dialog"),
      previewClassName: "min-h-40",
    },
    {
      id: "command-basic",
      title: "Basic",
      description: "A simple command menu in a dialog.",
      Demo: CommandBasic,
      source: docSource("command", "basic"),
    },
    {
      id: "command-groups",
      title: "Groups",
      description: "A command menu with groups, icons and separators.",
      Demo: CommandWithGroups,
      source: docSource("command", "groups"),
    },
    {
      id: "command-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CommandRtl,
      source: docSource("command", "rtl"),
      previewClassName: "items-start",
      direction: "rtl",
    },
    {
      id: "command-scrollable",
      title: "Scrollable",
      description: "Scrollable command menu with multiple items.",
      Demo: CommandManyItems,
      source: docSource("command", "scrollable"),
      previewClassName: "block",
    },
    {
      id: "command-shortcuts",
      title: "Shortcuts",
      description: "Command menu for search and quick actions.",
      Demo: CommandWithShortcuts,
      source: docSource("command", "shortcuts"),
    },
  ],
  anatomy: [
    {
      name: "Command",
      children: [
        { name: "CommandInput" },
        {
          name: "CommandList",
          children: [{ name: "CommandEmpty" }, { name: "CommandGroup", children: [{ name: "CommandItem" }] }],
        },
      ],
    },
  ],
  features: [
    "Built on cmdk — filters items by the input as you type; set shouldFilter={false} to filter server-side instead.",
    "CommandDialog wraps the palette in a Dialog with a screen-reader-only title/description by default, ready for the classic ⌘K pattern.",
    "CommandInput renders inside an InputGroup with a search icon addon — the same primitive Input Group and Input Search use.",
  ],
  api: [
    {
      name: "Command",
      description: "Built on cmdk. Filters items by the input as you type.",
      props: [
        {
          name: "value",
          type: "string",
          description: "The controlled highlighted item.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "The highlighted item when initially rendered (uncontrolled).",
        },
        {
          name: "onValueChange",
          type: "(value: string) => void",
          description: "Called when the highlighted item changes.",
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
          name: "open",
          type: "boolean",
          description: "The controlled visibility of the modal palette.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          description: "The visibility when initially rendered (uncontrolled).",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the modal palette’s visibility changes.",
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
