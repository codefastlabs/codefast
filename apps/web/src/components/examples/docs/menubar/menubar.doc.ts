import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { MenubarAppMenu } from "#/components/examples/docs/menubar/app-menu";

export const menubarDoc: ComponentDoc = {
  examples: [
    {
      id: "app-menu",
      title: "Application menu",
      description: "A desktop-style menu bar with File / Edit / View menus and shortcuts.",
      Demo: MenubarAppMenu,
      code: docSource("menubar", "app-menu"),
      previewClassName: "items-start",
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
          description:
            "A command row; MenubarShortcut shows its key hint. Also supports checkbox/radio items.",
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
    do: [
      "Group commands the way a desktop app would (File, Edit, View).",
      "Show shortcuts so power users learn them.",
    ],
    dont: ["Don’t use a menubar as primary site navigation.", "Don’t nest menus deeply."],
  },
  related: ["dropdown-menu", "context-menu", "navigation-menu"],
};
