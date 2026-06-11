import { NavigationMenuDropdown } from "#/components/examples/docs/navigation-menu/dropdown";
import { NavigationMenuMega } from "#/components/examples/docs/navigation-menu/mega";
import { NavigationMenuSimple } from "#/components/examples/docs/navigation-menu/simple";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const navigationMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "mega",
      title: "Mega menu",
      description: "Hover or focus a trigger to reveal an animated panel of links.",
      Demo: NavigationMenuMega,
      code: docSource("navigation-menu", "mega"),
      previewClassName: "min-h-44 items-start",
    },
    {
      id: "simple",
      title: "Plain links",
      description: "A flat menu with no dropdowns — just top-level links.",
      Demo: NavigationMenuSimple,
      code: docSource("navigation-menu", "simple"),
    },
    {
      id: "dropdown",
      title: "Single dropdown",
      description: "One trigger opening a list of described links.",
      Demo: NavigationMenuDropdown,
      code: docSource("navigation-menu", "dropdown"),
    },
  ],
  anatomy: docAnatomy("navigation-menu"),
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
