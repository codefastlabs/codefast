import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { SidebarControlledExample } from "#/registry/sidebar/controlled.example";
import { SidebarFooterExample } from "#/registry/sidebar/footer.example";
import { SidebarGroupActionExample } from "#/registry/sidebar/group-action.example";
import { SidebarGroupCollapsibleExample } from "#/registry/sidebar/group-collapsible.example";
import { SidebarGroupExample } from "#/registry/sidebar/group.example";
import { SidebarHeaderExample } from "#/registry/sidebar/header.example";
import { SidebarMenuActionExample } from "#/registry/sidebar/menu-action.example";
import { SidebarMenuBadgeExample } from "#/registry/sidebar/menu-badge.example";
import { SidebarMenuCollapsibleExample } from "#/registry/sidebar/menu-collapsible.example";
import { SidebarMenuSubExample } from "#/registry/sidebar/menu-sub.example";
import { SidebarMenuExample } from "#/registry/sidebar/menu.example";
import { SidebarRsc } from "#/registry/sidebar/rsc.example";
import { SidebarRtl } from "#/registry/sidebar/rtl.example";

export const sidebarDoc: ComponentDoc = {
  examples: [
    {
      id: "sidebar-controlled",
      title: "Controlled",
      description: "Control the sidebar open state with the SidebarProvider open and onOpenChange props.",
      Demo: SidebarControlledExample,
      source: docSource("sidebar", "controlled"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-footer",
      title: "Footer",
      description: "Add a sticky footer to the sidebar with SidebarFooter — commonly used for a user menu.",
      Demo: SidebarFooterExample,
      source: docSource("sidebar", "footer"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-group",
      title: "Group",
      description: "Group related menu items into a section with SidebarGroup and SidebarGroupLabel.",
      Demo: SidebarGroupExample,
      source: docSource("sidebar", "group"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-group-action",
      title: "Group Action",
      description: "Add an action button to a section with SidebarGroupAction.",
      Demo: SidebarGroupActionExample,
      source: docSource("sidebar", "group-action"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-group-collapsible",
      title: "Collapsible Group",
      description: "Make a SidebarGroup collapsible by wrapping it in a Collapsible component.",
      Demo: SidebarGroupCollapsibleExample,
      source: docSource("sidebar", "group-collapsible"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-header",
      title: "Header",
      description: "Add a sticky header to the sidebar with SidebarHeader — commonly a workspace switcher.",
      Demo: SidebarHeaderExample,
      source: docSource("sidebar", "header"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-menu",
      title: "Menu",
      description: "Render a menu of items inside a group with SidebarMenu and SidebarMenuButton.",
      Demo: SidebarMenuExample,
      source: docSource("sidebar", "menu"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-menu-action",
      title: "Menu Action",
      description: "Add a secondary action to a menu item with SidebarMenuAction.",
      Demo: SidebarMenuActionExample,
      source: docSource("sidebar", "menu-action"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-menu-badge",
      title: "Menu Badge",
      description: "Render a badge inside a menu item with SidebarMenuBadge.",
      Demo: SidebarMenuBadgeExample,
      source: docSource("sidebar", "menu-badge"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-menu-collapsible",
      title: "Collapsible Menu",
      description: "Make a menu item collapsible to reveal a nested submenu.",
      Demo: SidebarMenuCollapsibleExample,
      source: docSource("sidebar", "menu-collapsible"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-menu-sub",
      title: "Submenu",
      description: "Render a nested submenu inside a menu with SidebarMenuSub.",
      Demo: SidebarMenuSubExample,
      source: docSource("sidebar", "menu-sub"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-rsc",
      title: "React Server Component",
      description: "Stream menu items with a Suspense-style skeleton fallback using SidebarMenuSkeleton.",
      Demo: SidebarRsc,
      source: docSource("sidebar", "rsc"),
      previewClassName: "items-stretch",
    },
    {
      id: "sidebar-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SidebarRtl,
      source: docSource("sidebar", "rtl"),
      previewClassName: "items-stretch",
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "SidebarProvider",
      children: [
        {
          name: "Sidebar",
          children: [
            {
              name: "SidebarContent",
              children: [
                {
                  name: "SidebarGroup",
                  children: [
                    {
                      name: "SidebarMenu",
                      children: [{ name: "SidebarMenuItem", children: [{ name: "SidebarMenuButton" }] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { name: "SidebarTrigger" },
      ],
    },
  ],
  features: [
    "Persists the open/collapsed state in a sidebar_state cookie (7-day max-age), so a full page reload keeps the sidebar as the user left it.",
    "Automatically switches to a Sheet-based drawer on mobile via useIsMobile() — no separate mobile layout to build.",
  ],
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
          name: "open",
          type: "boolean",
          description: "The controlled open (expanded) state.",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the open state changes.",
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
      { keys: ["⌘/Ctrl", "B"], description: "Toggles the sidebar from anywhere in the app." },
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
