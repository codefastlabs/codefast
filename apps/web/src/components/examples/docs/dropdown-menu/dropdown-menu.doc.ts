import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { DropdownCheckboxes } from "#/components/examples/docs/dropdown-menu/checkboxes";
import { DropdownRadio } from "#/components/examples/docs/dropdown-menu/radio";

import { DropdownActions } from "#/components/examples/docs/dropdown-menu/actions";

export const dropdownMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "checkboxes",
      title: "Checkbox items",
      description: "A column-toggle menu — checkbox items drive state, with a live count below.",
      Demo: DropdownCheckboxes,
      code: docSource("dropdown-menu", "checkboxes"),
      previewClassName: "min-h-40",
    },
    {
      id: "radio",
      title: "Radio group",
      description: "A single-choice sort menu backed by DropdownMenuRadioGroup.",
      Demo: DropdownRadio,
      code: docSource("dropdown-menu", "radio"),
      previewClassName: "min-h-40",
    },
    {
      id: "actions",
      title: "Account menu",
      description: "Items, shortcuts, and a destructive action.",
      Demo: DropdownActions,
      code: docSource("dropdown-menu", "actions"),
    },
  ],
  anatomy: docAnatomy("dropdown-menu"),
  api: [
    {
      name: "DropdownMenuCheckboxItem",
      description: "A menu item with a checkmark you control.",
      props: [
        {
          name: "checked / onCheckedChange",
          type: "boolean / (checked: boolean) => void",
          description: "Controlled checked state and its handler.",
        },
      ],
    },
    {
      name: "DropdownMenuRadioGroup / RadioItem",
      description: "Single-choice section inside the menu.",
      props: [
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "On the group: the chosen RadioItem value.",
        },
      ],
    },
    {
      name: "DropdownMenuContent",
      props: [
        {
          name: "align / side",
          type: '"start"|"center"|"end" / "top"|"bottom"…',
          default: '"center" / "bottom"',
          description: "Placement relative to the trigger.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the menu from the trigger." },
      { keys: ["Arrow", "Down"], description: "Moves to the next item." },
      { keys: ["Arrow", "Up"], description: "Moves to the previous item." },
      { keys: ["Enter"], description: "Activates the focused item." },
      { keys: ["Esc"], description: "Closes the menu and restores focus." },
    ],
    notes: [
      "Implements the ARIA menu pattern with type-ahead and roving focus.",
      "Checkbox and radio items expose aria-checked so their state is announced.",
      "Use a Select (listbox) when the goal is choosing a form value, not running an action.",
    ],
  },
  guidelines: {
    do: [
      "Group related actions and label the groups.",
      "Use checkbox items for toggles and a radio group for one-of-many.",
    ],
    dont: [
      "Don’t nest more than one level of submenus.",
      "Don’t put primary page actions only in a dropdown.",
    ],
  },
  related: ["context-menu", "select", "menubar", "command"],
};
