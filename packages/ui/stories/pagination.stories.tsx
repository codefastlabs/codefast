import { useState } from "react";
import { expect } from "storybook/test";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "#/components/pagination";

import preview from "../.storybook/preview";

/**
 * Pagination — a layout-only COMPOSITE. The root `<nav>` (`Pagination`) only forwards
 * native attributes, so it has NO Controls of its own; the interesting prop lives on the
 * subcomponent `PaginationLink` (`isActive`). Content is authored for Storybook and is NOT
 * synced with the apps/web registry.
 *
 * **Anatomy:** `Pagination > PaginationContent > PaginationItem > (PaginationLink | PaginationPrevious | PaginationNext | PaginationEllipsis)`.
 * Mark the current page with `isActive` on its `PaginationLink`.
 */
const meta = preview.meta({
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component: [
          "Navigation for splitting long lists of content across multiple pages.",
          "",
          "**Anatomy:** `Pagination > PaginationContent > PaginationItem > (PaginationLink | PaginationPrevious | PaginationNext | PaginationEllipsis)`.",
          "Mark the current page with `isActive` on its `PaginationLink`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  },
  title: "Navigation/Pagination",
});

export const Default = meta.story({
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});

/** A compact prev/next-only composition for tight toolbars — a genuinely different layout. */
export const PreviousNextOnly = meta.story({
  render: () => (
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});

/**
 * Stateful composition: clicking a page link moves `aria-current="page"` via local state.
 * A genuinely different composition (controlled active page), so it has its own render.
 */
export const SelectsPageOnClick = meta.story({
  render: function Render() {
    const [page, setPage] = useState(1);

    return (
      <Pagination>
        <PaginationContent>
          {[1, 2, 3].map((value) => (
            <PaginationItem key={value}>
              <PaginationLink
                href="#"
                isActive={page === value}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(value);
                }}
              >
                {value}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    );
  },
});

SelectsPageOnClick.test("moves aria-current to the clicked page", async ({ canvas, userEvent }) => {
  await expect(canvas.getByRole("link", { name: "1" })).toHaveAttribute("aria-current", "page");

  await userEvent.click(canvas.getByRole("link", { name: "3" }));

  await expect(await canvas.findByRole("link", { current: "page" })).toHaveTextContent("3");
  await expect(canvas.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current", "page");
});
