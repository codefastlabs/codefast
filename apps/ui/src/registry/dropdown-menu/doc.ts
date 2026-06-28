import { DropdownMenuAvatar } from "#/registry/dropdown-menu/avatar.example";
import { DropdownMenuBasic } from "#/registry/dropdown-menu/basic.example";
import { DropdownMenuCheckboxesIcons } from "#/registry/dropdown-menu/checkboxes-icons.example";
import { DropdownMenuCheckboxes } from "#/registry/dropdown-menu/checkboxes.example";
import { DropdownMenuComplex } from "#/registry/dropdown-menu/complex.example";
import { DropdownMenuDestructive } from "#/registry/dropdown-menu/destructive.example";
import { DropdownMenuIcons } from "#/registry/dropdown-menu/icons.example";
import { DropdownMenuRadioGroupDemo } from "#/registry/dropdown-menu/radio-group.example";
import { DropdownMenuRadioIcons } from "#/registry/dropdown-menu/radio-icons.example";
import { DropdownMenuRtl } from "#/registry/dropdown-menu/rtl.example";
import { DropdownMenuShortcuts } from "#/registry/dropdown-menu/shortcuts.example";
import { DropdownMenuSubmenu } from "#/registry/dropdown-menu/submenu.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const dropdownMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "checkboxes",
      title: "Checkbox items",
      description: "A column-toggle menu — checkbox items drive state, with a live count below.",
      Demo: DropdownMenuCheckboxes,
      source: docSource("dropdown-menu", "checkboxes"),
      previewClassName: "min-h-40",
    },
    {
      id: "dropdown-menu-avatar",
      title: "Avatar",
      description: "An account switcher dropdown triggered by an avatar.",
      Demo: DropdownMenuAvatar,
      source: docSource("dropdown-menu", "avatar"),
    },
    {
      id: "dropdown-menu-basic",
      title: "Basic",
      description: "A basic dropdown menu with labels and separators.",
      Demo: DropdownMenuBasic,
      source: docSource("dropdown-menu", "basic"),
    },
    {
      id: "dropdown-menu-checkboxes-icons",
      title: "Checkboxes Icons",
      description: "Add icons to checkbox items.",
      Demo: DropdownMenuCheckboxesIcons,
      source: docSource("dropdown-menu", "checkboxes-icons"),
    },
    {
      id: "dropdown-menu-complex",
      title: "Complex",
      description: "A richer example combining groups, icons, and submenus.",
      Demo: DropdownMenuComplex,
      source: docSource("dropdown-menu", "complex"),
    },
    {
      id: "dropdown-menu-destructive",
      title: "Destructive",
      description: "Use variant='destructive' for irreversible actions.",
      Demo: DropdownMenuDestructive,
      source: docSource("dropdown-menu", "destructive"),
    },
    {
      id: "dropdown-menu-icons",
      title: "Icons",
      description: "Combine icons with labels for quick scanning.",
      Demo: DropdownMenuIcons,
      source: docSource("dropdown-menu", "icons"),
    },
    {
      id: "dropdown-menu-radio-group",
      title: "Radio Group",
      description: "Use DropdownMenuRadioGroup for exclusive choices.",
      Demo: DropdownMenuRadioGroupDemo,
      source: docSource("dropdown-menu", "radio-group"),
    },
    {
      id: "dropdown-menu-radio-icons",
      title: "Radio Icons",
      description: "Show radio options with icons.",
      Demo: DropdownMenuRadioIcons,
      source: docSource("dropdown-menu", "radio-icons"),
    },
    {
      id: "dropdown-menu-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: DropdownMenuRtl,
      source: docSource("dropdown-menu", "rtl"),
      direction: "rtl",
    },
    {
      id: "dropdown-menu-shortcuts",
      title: "Shortcuts",
      description: "Add DropdownMenuShortcut to show keyboard hints.",
      Demo: DropdownMenuShortcuts,
      source: docSource("dropdown-menu", "shortcuts"),
    },
    {
      id: "dropdown-menu-submenu",
      title: "Submenu",
      description: "Use DropdownMenuSub to nest secondary actions.",
      Demo: DropdownMenuSubmenu,
      source: docSource("dropdown-menu", "submenu"),
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
    dont: ["Don’t nest more than one level of submenus.", "Don’t put primary page actions only in a dropdown."],
  },
  related: ["context-menu", "select", "menubar", "command"],
};
