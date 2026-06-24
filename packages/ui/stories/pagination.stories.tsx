import { useState } from "react";
import { expect } from "storybook/test";

import { Field, FieldLabel } from "#/components/field";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "#/components/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "#/components/select";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Pagination,
  subcomponents: {
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
  },
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

export const Simple = meta.story({
  render: () => (
    <Pagination>
      <PaginationContent>
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
          <PaginationLink href="#">4</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">5</PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});

export const IconsOnly = meta.story({
  render: () => (
    <div className="flex items-center justify-between gap-4">
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
        <Select defaultValue="25">
          <SelectTrigger className="w-20" id="select-rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
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
    </div>
  ),
});

/**
 * Interaction test — runs in a real browser via `vitest run --project=storybook`.
 * Uses local state so clicking a page link actually moves `aria-current="page"`.
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

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsPageOnClick.test("selects page on click", async ({ canvas, userEvent }) => {
  await expect(canvas.getByRole("link", { name: "1" })).toHaveAttribute("aria-current", "page");

  await userEvent.click(canvas.getByRole("link", { name: "3" }));

  await expect(await canvas.findByRole("link", { current: "page" })).toHaveTextContent("3");
  await expect(canvas.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current", "page");
});
