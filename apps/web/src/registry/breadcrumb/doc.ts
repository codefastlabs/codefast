import { BreadcrumbCollapsed } from "#/registry/breadcrumb/collapsed.example";
import { BreadcrumbCustomSeparator } from "#/registry/breadcrumb/custom-separator.example";
import { BreadcrumbPath } from "#/registry/breadcrumb/path.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const breadcrumbDoc: ComponentDoc = {
  examples: [
    {
      id: "path",
      title: "Location trail",
      description: "A hierarchy of links ending in the current page, with custom separators.",
      Demo: BreadcrumbPath,
      source: docSource("breadcrumb", "path"),
    },
    {
      id: "collapsed",
      title: "Collapsed middle",
      description: "Hide intermediate levels behind an ellipsis.",
      Demo: BreadcrumbCollapsed,
      source: docSource("breadcrumb", "collapsed"),
    },
    {
      id: "custom-separator",
      title: "Custom separator",
      description: "Swap the chevron for any node — here, a slash.",
      Demo: BreadcrumbCustomSeparator,
      source: docSource("breadcrumb", "custom-separator"),
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
