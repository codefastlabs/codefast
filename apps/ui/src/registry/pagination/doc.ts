import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { PaginationIconsOnly } from "#/registry/pagination/icons-only.example";
import { PaginationRtl } from "#/registry/pagination/rtl.example";
import { PaginationSimple } from "#/registry/pagination/simple.example";

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
      name: "PaginationLink",
      description: "A page link. Compose your own paginator; wire it to your router or state.",
      props: [
        {
          name: "isActive",
          type: "boolean",
          description: "Marks the current page — swaps to the outline Button variant.",
        },
      ],
    },
    {
      name: "PaginationPrevious",
      description: "The previous-page control — disable at the lower bound via class + aria-disabled.",
      props: [
        {
          name: "text",
          type: "string",
          default: '"Previous"',
          description: "The label shown above the sm breakpoint.",
        },
      ],
    },
    {
      name: "PaginationNext",
      description: "The next-page control — disable at the upper bound via class + aria-disabled.",
      props: [
        {
          name: "text",
          type: "string",
          default: '"Next"',
          description: "The label shown above the sm breakpoint.",
        },
      ],
    },
    {
      name: "PaginationEllipsis",
      description: "A non-interactive gap marker for skipped pages. Renders a fixed MoreHorizontal icon.",
      props: [{ name: "className", type: "string", description: "Compose additional classes onto the span." }],
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
