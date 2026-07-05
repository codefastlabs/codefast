import { MenubarCheckbox } from "#/registry/menubar/checkbox.example";
import { MenubarIcons } from "#/registry/menubar/icons.example";
import { MenubarRadio } from "#/registry/menubar/radio.example";
import { MenubarRtl } from "#/registry/menubar/rtl.example";
import { MenubarSubmenu } from "#/registry/menubar/submenu.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

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
      name: "Menubar / MenubarMenu",
      description: "The horizontal bar and each top-level menu.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "One MenubarMenu per top-level menu (File, Edit…).",
        },
      ],
    },
    {
      name: "MenubarItem / MenubarShortcut",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "A command row; MenubarShortcut shows its key hint. Also supports checkbox/radio items.",
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
