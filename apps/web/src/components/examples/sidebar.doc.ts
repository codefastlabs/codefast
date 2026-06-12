import { SidebarAppShell } from "#/components/examples/sidebar.app-shell.example";
import { SidebarBadges } from "#/components/examples/sidebar.badges.example";
import { SidebarSubmenu } from "#/components/examples/sidebar.submenu.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const sidebarDoc: ComponentDoc = {
  examples: [
    {
      id: "app-shell",
      title: "App shell",
      description: "A collapsible sidebar with grouped menu — toggle the rail with the trigger.",
      Demo: SidebarAppShell,
      source: docSource("sidebar", "app-shell"),
      previewClassName: "items-stretch",
    },
    {
      id: "submenu",
      title: "Nested items",
      description: "Expand a menu item into an indented sub-menu.",
      Demo: SidebarSubmenu,
      source: docSource("sidebar", "submenu"),
      previewClassName: "items-start",
    },
    {
      id: "badges",
      title: "Active state & badges",
      description: "Highlight the current item and show counts.",
      Demo: SidebarBadges,
      source: docSource("sidebar", "badges"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("sidebar"),
  api: [
    {
      name: "SidebarProvider",
      description: "Wraps the shell; owns collapse state and keyboard shortcut.",
      props: [
        {
          name: "defaultOpen",
          type: "boolean",
          default: "true",
          description: "Whether the sidebar starts expanded.",
        },
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Control the collapsed state yourself.",
        },
      ],
    },
    {
      name: "Sidebar parts",
      props: [
        {
          name: "SidebarMenuButton",
          type: "ReactNode",
          description: "A nav row; compose inside SidebarMenuItem / SidebarGroup.",
        },
        {
          name: "SidebarTrigger",
          type: "—",
          description: "Toggles the sidebar; place it in your main content.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves through the menu buttons." },
      { keys: ["Enter"], description: "Activates the focused item." },
    ],
    notes: [
      "Built as a nav landmark; the collapsed rail keeps icons reachable.",
      "On mobile it becomes a sheet — ensure the trigger is always reachable.",
      "Give icon-only collapsed items accessible names (tooltips or labels).",
    ],
  },
  guidelines: {
    do: ["Use for app shells with persistent navigation.", "Group links with labels and keep the list shallow."],
    dont: ["Don’t use a sidebar for a content site with few pages.", "Don’t hide the toggle — users need a way back."],
  },
  related: ["resizable", "navigation-menu", "sheet"],
};
