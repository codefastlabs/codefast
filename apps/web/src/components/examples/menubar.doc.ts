import { MenubarAppMenu } from "#/components/examples/menubar.app-menu";
import { MenubarSelections } from "#/components/examples/menubar.selections";
import { MenubarSubmenu } from "#/components/examples/menubar.submenu";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const menubarDoc: ComponentDoc = {
  examples: [
    {
      id: "app-menu",
      title: "Application menu",
      description: "A desktop-style menu bar with File / Edit / View menus and shortcuts.",
      Demo: MenubarAppMenu,
      source: docSource("menubar", "app-menu"),
      previewClassName: "items-start",
    },
    {
      id: "selections",
      title: "Checkbox & radio items",
      description: "Toggle options and pick one from a radio group.",
      Demo: MenubarSelections,
      source: docSource("menubar", "selections"),
    },
    {
      id: "submenu",
      title: "Nested submenu",
      description: "Reveal a second level with a sub-trigger.",
      Demo: MenubarSubmenu,
      source: docSource("menubar", "submenu"),
    },
  ],
  anatomy: docAnatomy("menubar"),
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
