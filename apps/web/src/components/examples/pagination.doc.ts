import { PaginationControlled } from "#/components/examples/pagination.controlled.example";
import { PaginationPrevNext } from "#/components/examples/pagination.prev-next.example";
import { PaginationSimple } from "#/components/examples/pagination.simple.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const paginationDoc: ComponentDoc = {
  examples: [
    {
      id: "controlled",
      title: "Controlled with a window",
      description: "Click pages or prev/next — the windowed list and disabled ends update from state.",
      Demo: PaginationControlled,
      source: docSource("pagination", "controlled"),
    },
    {
      id: "simple",
      title: "Simple",
      description: "Static markup with an active page and prev / next.",
      Demo: PaginationSimple,
      source: docSource("pagination", "simple"),
    },
    {
      id: "prev-next",
      title: "Previous / next only",
      description: "A minimal pager with disabled edges and a counter.",
      Demo: PaginationPrevNext,
      source: docSource("pagination", "prev-next"),
    },
  ],
  anatomy: docAnatomy("pagination"),
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
