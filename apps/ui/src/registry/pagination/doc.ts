import { PaginationIconsOnly } from "#/registry/pagination/icons-only.example";
import { PaginationRtl } from "#/registry/pagination/rtl.example";
import { PaginationSimple } from "#/registry/pagination/simple.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const paginationDoc: ComponentDoc = {
  examples: [
    {
      id: "simple",
      title: "Simple",
      description: "Static markup with an active page and prev / next.",
      Demo: PaginationSimple,
      source: docSource("pagination", "simple"),
    },
    {
      id: "pagination-icons-only",
      title: "Icons Only",
      description:
        "Use just the previous and next buttons without page numbers. This is useful for data tables with a rows per page selector.",
      Demo: PaginationIconsOnly,
      source: docSource("pagination", "icons-only"),
    },
    {
      id: "pagination-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: PaginationRtl,
      source: docSource("pagination", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "Pagination",
      children: [
        {
          name: "PaginationContent",
          children: [
            { name: "PaginationItem", children: [{ name: "PaginationPrevious" }] },
            { name: "PaginationItem", children: [{ name: "PaginationLink" }] },
            { name: "PaginationItem", children: [{ name: "PaginationEllipsis" }] },
            { name: "PaginationItem", children: [{ name: "PaginationNext" }] },
          ],
        },
      ],
    },
  ],
  features: [
    "Every part is a plain <a>/<li>/<nav> — wire onClick/href to your router or state yourself; there's no built-in page-state management.",
    "PaginationLink's isActive swaps between outline (current page) and ghost (other pages) Button variants automatically.",
    "PaginationPrevious/PaginationNext hide their text label below the sm breakpoint, leaving just the chevron icon.",
  ],
  api: [
    {
      name: "Pagination parts",
      description: "Compose your own paginator; wire links to your router or state.",
      props: [
        {
          name: "PaginationLink",
          type: "{ isActive?: boolean } & anchor props",
          description: "A page link. Set isActive on the current page.",
        },
        {
          name: "PaginationPrevious / PaginationNext",
          type: "anchor props",
          description: "Prev/next controls — disable at the bounds via class + aria-disabled.",
        },
        {
          name: "PaginationEllipsis",
          type: "—",
          description: "A non-interactive gap marker for skipped pages.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Renders a nav landmark labelled “pagination”.",
      'Mark the current page link with aria-current="page".',
      "Communicate disabled prev/next with aria-disabled, not just opacity.",
    ],
  },
  guidelines: {
    do: [
      "Show first, last, current, and neighbours; collapse the rest with an ellipsis.",
      "Keep the active page clearly highlighted.",
    ],
    dont: ["Don’t render dozens of page links — window them.", "Don’t leave prev/next clickable at the bounds."],
  },
  related: ["breadcrumb", "button-group", "table"],
};
