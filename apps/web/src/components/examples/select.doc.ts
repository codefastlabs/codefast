import { SelectControlled } from "#/components/examples/select.controlled.example";
import { SelectGrouped } from "#/components/examples/select.grouped.example";
import { SelectStatus } from "#/components/examples/select.status.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const selectDoc: ComponentDoc = {
  examples: [
    {
      id: "status",
      title: "Controlled with icons",
      description: "A real issue-status picker: controlled value, colour markers, and a live readout.",
      Demo: SelectStatus,
      source: docSource("select", "status"),
    },
    {
      id: "grouped",
      title: "Groups & disabled items",
      description:
        "Organise long lists with SelectGroup + SelectLabel, divide with SelectSeparator, and disable any item.",
      Demo: SelectGrouped,
      source: docSource("select", "grouped"),
    },
    {
      id: "controlled",
      title: "Controlled value",
      description: "Bind the value to state and read it back.",
      Demo: SelectControlled,
      source: docSource("select", "controlled"),
    },
  ],
  anatomy: docAnatomy("select"),
  api: [
    {
      name: "Select",
      description: "Root. Owns the selected value.",
      props: [
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "Controlled selection and its handler.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Initial value when uncontrolled.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the whole control.",
        },
      ],
    },
    {
      name: "SelectGroup / SelectLabel",
      description: "Wrap related options so screen readers announce the group, not just visual spacing.",
      props: [
        {
          name: "SelectLabel children",
          type: "ReactNode",
          description: "Heading text for the group (required inside SelectGroup for accessibility).",
        },
      ],
    },
    {
      name: "SelectItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "The value submitted when this item is chosen (required).",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Makes a single option non-selectable.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the menu when the trigger is focused." },
      { keys: ["Arrow", "Down"], description: "Moves to the next option." },
      { keys: ["Arrow", "Up"], description: "Moves to the previous option." },
      { keys: ["Enter"], description: "Selects the highlighted option." },
      { keys: ["Esc"], description: "Closes without changing the value." },
    ],
    notes: [
      "Implements the ARIA listbox pattern with type-ahead — start typing to jump to an option.",
      "Use SelectLabel inside a SelectGroup so groups are announced, not just visually separated.",
      "For native mobile behaviour with zero JS, prefer Native Select.",
    ],
  },
  guidelines: {
    do: [
      "Always set a placeholder via SelectValue for empty state.",
      "Group and label options once a list grows past ~7 items.",
    ],
    dont: [
      "Don’t use Select for boolean choices — use a Switch or Checkbox.",
      "Don’t put interactive controls other than options inside the menu.",
    ],
  },
  related: ["native-select", "dropdown-menu", "radio-group"],
};
