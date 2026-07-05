import { docDemo, docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { NavigationMenuDemo } from "#/registry/navigation-menu/demo";
import { NavigationMenuRtl } from "#/registry/navigation-menu/rtl.example";

export const navigationMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "navigation-menu-demo",
      title: "Demo",
      description: "A horizontal menu bar with dropdown panels of links.",
      Demo: NavigationMenuDemo,
      source: docDemo("navigation-menu"),
    },
    {
      id: "navigation-menu-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: NavigationMenuRtl,
      source: docSource("navigation-menu", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "NavigationMenu",
      children: [
        {
          name: "NavigationMenuList",
          children: [
            {
              name: "NavigationMenuItem",
              children: [{ name: "NavigationMenuTrigger" }, { name: "NavigationMenuContent" }],
            },
          ],
        },
      ],
    },
  ],
  features: [
    "viewport (default true) makes every item share one animated panel that resizes to fit the open content; set viewport={false} to render each NavigationMenuContent inline instead.",
    "NavigationMenuIndicator draws a small arrow that tracks the active trigger.",
  ],
  api: [
    {
      name: "NavigationMenu",
      description: "Site navigation with animated content panels.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "A NavigationMenuList of items, each a trigger + content or a plain link.",
        },
        {
          name: "viewport",
          type: "boolean",
          default: "true",
          description:
            "Share one animated viewport across items instead of each NavigationMenuContent positioning itself.",
        },
      ],
    },
    {
      name: "NavigationMenuLink",
      props: [
        {
          name: "asChild",
          type: "boolean",
          description: "Render your router’s Link while keeping menu semantics.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves between top-level items." },
      { keys: ["Enter"], description: "Opens the focused item’s panel." },
      { keys: ["Esc"], description: "Closes the open panel." },
    ],
    notes: [
      "Implements the ARIA navigation pattern; panels open on hover and focus.",
      "Use real links inside; render router Links via asChild.",
      "Touch users can’t hover — ensure links are reachable by tap too.",
    ],
  },
  guidelines: {
    do: ["Use for primary site navigation with grouped destinations.", "Keep panels shallow and scannable."],
    dont: ["Don’t put forms or complex controls in a nav panel.", "Don’t bury key links several levels deep."],
  },
  related: ["menubar", "breadcrumb", "tabs"],
};
