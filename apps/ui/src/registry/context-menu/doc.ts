import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { ContextMenuBasic } from "#/registry/context-menu/basic.example";
import { ContextMenuCheckboxes } from "#/registry/context-menu/checkboxes.example";
import { ContextMenuDestructive } from "#/registry/context-menu/destructive.example";
import { ContextMenuGroups } from "#/registry/context-menu/groups.example";
import { ContextMenuIcons } from "#/registry/context-menu/icons.example";
import { ContextMenuRadio } from "#/registry/context-menu/radio.example";
import { ContextMenuRtl } from "#/registry/context-menu/rtl.example";
import { ContextMenuShortcuts } from "#/registry/context-menu/shortcuts.example";
import { ContextMenuSides } from "#/registry/context-menu/sides.example";
import { ContextMenuSubmenu } from "#/registry/context-menu/submenu.example";

export const contextMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "context-menu-basic",
      title: "Basic",
      description: "A simple context menu with a few actions.",
      Demo: ContextMenuBasic,
      source: docSource("context-menu", "basic"),
    },
    {
      id: "context-menu-checkboxes",
      title: "Checkboxes",
      description: "Use ContextMenuCheckboxItem for toggles.",
      Demo: ContextMenuCheckboxes,
      source: docSource("context-menu", "checkboxes"),
    },
    {
      id: "context-menu-destructive",
      title: "Destructive",
      description: "Use variant='destructive' to style the menu item as destructive.",
      Demo: ContextMenuDestructive,
      source: docSource("context-menu", "destructive"),
    },
    {
      id: "context-menu-groups",
      title: "Groups",
      description: "Group related actions and separate them with dividers.",
      Demo: ContextMenuGroups,
      source: docSource("context-menu", "groups"),
    },
    {
      id: "context-menu-icons",
      title: "Icons",
      description: "Combine icons with labels for quick scanning.",
      Demo: ContextMenuIcons,
      source: docSource("context-menu", "icons"),
    },
    {
      id: "context-menu-radio",
      title: "Radio",
      description: "Use ContextMenuRadioItem for exclusive choices.",
      Demo: ContextMenuRadio,
      source: docSource("context-menu", "radio"),
    },
    {
      id: "context-menu-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ContextMenuRtl,
      source: docSource("context-menu", "rtl"),
      direction: "rtl",
    },
    {
      id: "context-menu-shortcuts",
      title: "Shortcuts",
      description: "Add ContextMenuShortcut to show keyboard hints.",
      Demo: ContextMenuShortcuts,
      source: docSource("context-menu", "shortcuts"),
    },
    {
      id: "context-menu-sides",
      title: "Sides",
      description: "Control submenu placement with side and align props.",
      Demo: ContextMenuSides,
      source: docSource("context-menu", "sides"),
      previewClassName: "block",
    },
    {
      id: "context-menu-submenu",
      title: "Submenu",
      description: "Use ContextMenuSub to nest secondary actions.",
      Demo: ContextMenuSubmenu,
      source: docSource("context-menu", "submenu"),
    },
  ],
  anatomy: [
    {
      name: "ContextMenu",
      children: [
        { name: "ContextMenuTrigger" },
        { name: "ContextMenuContent", children: [{ name: "ContextMenuItem" }] },
      ],
    },
  ],
  features: [
    "Opens via the context-menu key or long-press too, not just right-click.",
    'variant="destructive" tints text/icon and the focus background for irreversible actions; inset aligns text with icon-led siblings.',
    "ContextMenuSub/SubTrigger/SubContent nest a secondary menu; side/align on ContextMenuSubContent control submenu placement.",
    "ContextMenuCheckboxItem and ContextMenuRadioGroup/RadioItem add toggleable or exclusive-choice items.",
  ],
  api: [
    {
      name: "ContextMenuTrigger",
      description: "The region that opens the menu on right-click (or long-press).",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The area users right-click. Style it however you like.",
        },
      ],
    },
    {
      name: "ContextMenuCheckboxItem / RadioGroup",
      props: [
        {
          name: "checked / onCheckedChange",
          type: "boolean / (checked: boolean) => void",
          description: "On a checkbox item: its toggled state.",
        },
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "On a radio group: the selected RadioItem value.",
        },
      ],
    },
    {
      name: "ContextMenuSub",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Pair ContextMenuSubTrigger with ContextMenuSubContent for a submenu.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Down"], description: "Moves to the next item (once open)." },
      { keys: ["Arrow", "Right"], description: "Opens the focused submenu." },
      { keys: ["Enter"], description: "Activates the focused item." },
      { keys: ["Esc"], description: "Closes the menu." },
    ],
    notes: [
      "Opens with the context-menu key or long-press, not just right-click.",
      "Checkbox and radio items expose aria-checked for assistive tech.",
      "Always offer the same actions elsewhere — a context menu must not be the only path.",
    ],
  },
  guidelines: {
    do: [
      "Use for contextual shortcuts on an element (canvas, row, file).",
      "Mirror the most-used items in a visible toolbar or button menu.",
    ],
    dont: ["Don’t hide primary actions only behind right-click.", "Don’t nest submenus more than one level deep."],
  },
  related: ["dropdown-menu", "menubar", "command"],
};
