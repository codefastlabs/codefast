import { BreadcrumbBasic } from "#/registry/breadcrumb/basic.example";
import { BreadcrumbDropdown } from "#/registry/breadcrumb/dropdown.example";
import { BreadcrumbEllipsisDemo } from "#/registry/breadcrumb/ellipsis.example";
import { BreadcrumbLinkDemo } from "#/registry/breadcrumb/link.example";
import { BreadcrumbRtl } from "#/registry/breadcrumb/rtl.example";
import { BreadcrumbSeparatorDemo } from "#/registry/breadcrumb/separator.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const breadcrumbDoc: ComponentDoc = {
  examples: [
    {
      id: "breadcrumb-basic",
      title: "Basic",
      description: "A basic breadcrumb with a home link and a components link.",
      Demo: BreadcrumbBasic,
      source: docSource("breadcrumb", "basic"),
    },
    {
      id: "breadcrumb-dropdown",
      title: "Dropdown",
      description: "You can compose <BreadcrumbItem /> with a <DropdownMenu /> to create a dropdown in the breadcrumb.",
      Demo: BreadcrumbDropdown,
      source: docSource("breadcrumb", "dropdown"),
    },
    {
      id: "breadcrumb-ellipsis",
      title: "Collapsed",
      description:
        "We provide a <BreadcrumbEllipsis /> component to show a collapsed state when the breadcrumb is too long.",
      Demo: BreadcrumbEllipsisDemo,
      source: docSource("breadcrumb", "ellipsis"),
    },
    {
      id: "breadcrumb-link",
      title: "Link component",
      description:
        "To use a custom link component from your routing library, you can use the asChild prop on <BreadcrumbLink />.",
      Demo: BreadcrumbLinkDemo,
      source: docSource("breadcrumb", "link"),
    },
    {
      id: "breadcrumb-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: BreadcrumbRtl,
      source: docSource("breadcrumb", "rtl"),
      direction: "rtl",
    },
    {
      id: "breadcrumb-separator",
      title: "Custom separator",
      description: "Use a custom component as children for <BreadcrumbSeparator /> to create a custom separator.",
      Demo: BreadcrumbSeparatorDemo,
      source: docSource("breadcrumb", "separator"),
    },
  ],
  anatomy: docAnatomy("breadcrumb"),
  api: [
    {
      name: "Breadcrumb parts",
      description: "Compose the trail from a list of items and separators.",
      props: [
        {
          name: "BreadcrumbLink",
          type: "ReactNode",
          description: "A navigable ancestor. Use asChild to render a router Link.",
        },
        {
          name: "BreadcrumbPage",
          type: "ReactNode",
          description: "The current page — not a link; marked aria-current.",
        },
        {
          name: "BreadcrumbSeparator",
          type: "ReactNode",
          description: "Visual divider; defaults to a slash, override with any icon.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Renders a nav landmark labelled “breadcrumb”.",
      'BreadcrumbPage carries aria-current="page" for the final crumb.',
      "Separators are decorative and hidden from assistive tech.",
    ],
  },
  guidelines: {
    do: [
      "Reflect the real page hierarchy, ending in the current page.",
      "Collapse long trails with an ellipsis on small screens.",
    ],
    dont: ["Don’t make the current page a link.", "Don’t use breadcrumbs as primary navigation."],
  },
  related: ["pagination", "navigation-menu", "tabs"],
};
