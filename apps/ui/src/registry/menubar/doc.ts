import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { MenubarCheckbox } from "#/registry/menubar/checkbox.example";
import { MenubarIcons } from "#/registry/menubar/icons.example";
import { MenubarRadio } from "#/registry/menubar/radio.example";
import { MenubarRtl } from "#/registry/menubar/rtl.example";
import { MenubarSubmenu } from "#/registry/menubar/submenu.example";

export const menubarDoc: ComponentDoc = {
  usage: docUsage("menubar"),
  examples: [
    {
      id: "submenu",
      title: "Nested submenu",
      description: "Reveal a second level with a sub-trigger.",
      Demo: MenubarSubmenu,
      source: docSource("menubar", "submenu"),
    },
    {
      id: "menubar-checkbox",
      title: "Checkbox",
      description: "Use MenubarCheckboxItem for toggleable options.",
      Demo: MenubarCheckbox,
      source: docSource("menubar", "checkbox"),
    },
    {
      id: "menubar-icons",
      title: "With Icons",
      description:
        "A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.",
      Demo: MenubarIcons,
      source: docSource("menubar", "icons"),
    },
    {
      id: "menubar-radio",
      title: "Radio",
      description: "Use MenubarRadioGroup and MenubarRadioItem for single-select options.",
      Demo: MenubarRadio,
      source: docSource("menubar", "radio"),
    },
    {
      id: "menubar-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: MenubarRtl,
      source: docSource("menubar", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "Menubar",
      children: [
        {
          name: "MenubarMenu",
          children: [
            { name: "MenubarTrigger" },
            { name: "MenubarContent", children: [{ name: "MenubarItem", children: [{ name: "MenubarShortcut" }] }] },
          ],
        },
      ],
    },
  ],
  features: [
    "Multiple MenubarMenu siblings share roving focus — Left/Right arrow moves between top-level menus, Down opens the focused one.",
    "Supports the same item types as Dropdown Menu and Context Menu — checkbox items, a radio group, submenus, and destructive variants.",
    "Best suited to desktop; on mobile or touch, prefer a Dropdown Menu or Sheet instead.",
  ],
  api: [
    {
      name: "Menubar",
      description: "The horizontal bar that hosts roving focus across its top-level menus.",
      props: [
        {
          name: "value",
          type: "string",
          description: "Controlled value of the currently open menu.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Uncontrolled initial value of the open menu.",
        },
        {
          name: "onValueChange",
          type: "(value: string) => void",
          description: "Called when the open menu changes.",
        },
        {
          name: "loop",
          type: "boolean",
          description: "Whether arrow-key navigation loops from the last menu back to the first.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "One MenubarMenu per top-level menu (File, Edit…).",
        },
      ],
    },
    {
      name: "MenubarMenu",
      description: "One top-level menu — pairs a MenubarTrigger with its MenubarContent.",
      props: [
        {
          name: "value",
          type: "string",
          description: "Identifies this menu; required when Menubar's value/onValueChange are controlled.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "A MenubarTrigger and its MenubarContent.",
        },
      ],
    },
    {
      name: "MenubarItem",
      description: "A single command row inside MenubarContent.",
      props: [
        {
          name: "inset",
          type: "boolean",
          default: "false",
          description: "Adds start padding to align with items that have an icon or indicator.",
        },
        {
          name: "variant",
          type: '"default" | "destructive"',
          default: '"default"',
          description: "Use destructive for irreversible actions.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "Label text, optionally followed by a MenubarShortcut.",
        },
      ],
    },
    {
      name: "MenubarShortcut",
      description: "Right-aligned key-hint text within a MenubarItem.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The shortcut label, e.g. '⌘S'.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Left"], description: "Moves between top-level menus." },
      { keys: ["Arrow", "Down"], description: "Opens / moves down a menu." },
      { keys: ["Enter"], description: "Activates the focused item." },
      { keys: ["Esc"], description: "Closes the open menu." },
    ],
    notes: [
      "Implements the ARIA menubar pattern with roving focus.",
      "Best on desktop; on mobile prefer a Dropdown Menu or Sheet.",
      "Mirror essential commands elsewhere — don’t hide them only here.",
    ],
  },
  guidelines: {
    do: ["Group commands the way a desktop app would (File, Edit, View).", "Show shortcuts so power users learn them."],
    dont: ["Don’t use a menubar as primary site navigation.", "Don’t nest menus deeply."],
  },
  related: ["dropdown-menu", "context-menu", "navigation-menu"],
};
