import { Button } from "@codefast/ui/button";
import { ELLIPSIS, usePagination } from "@codefast/ui/hooks/use-pagination";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";

interface PaginatedListProps extends Omit<ComponentProps<"div">, "children"> {
  items: ReadonlyArray<string>;
  resultsPerPage?: number | undefined;
}

/**
 * List with a `usePagination`-driven pager: renders the current page slice and a page
 * control whose collapsed ranges come from the hook's `ELLIPSIS` marker.
 */
export function PaginatedList({ items, resultsPerPage = 5, className, ...props }: PaginatedListProps): ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));

  const range = usePagination({ currentPage, resultsPerPage, totalResults });

  const start = (currentPage - 1) * resultsPerPage;
  const pageItems = items.slice(start, start + resultsPerPage);

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {pageItems.map((item) => (
          <li key={item} className="px-4 py-2.5 text-sm">
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          disabled={currentPage <= 1}
          size="sm"
          variant="outline"
          // PaginatedList owns the pager: steps to the previous page, clamped at the first.
          onClick={() => {
            setCurrentPage((page) => Math.max(1, page - 1));
          }}
        >
          Prev
        </Button>

        {range.map((entry, index) =>
          typeof entry === "number" ? (
            <Button
              key={entry}
              size="sm"
              variant={entry === currentPage ? "default" : "ghost"}
              // PaginatedList owns the pager: jumps directly to the chosen page.
              onClick={() => {
                setCurrentPage(entry);
              }}
            >
              {entry}
            </Button>
          ) : (
            <span key={`${ELLIPSIS}-${String(index)}`} className="px-2 text-sm text-muted-foreground">
              {entry}
            </span>
          ),
        )}

        <Button
          disabled={currentPage >= totalPages}
          size="sm"
          variant="outline"
          // PaginatedList owns the pager: steps to the next page, clamped at the last.
          onClick={() => {
            setCurrentPage((page) => Math.min(totalPages, page + 1));
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
