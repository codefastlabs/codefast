import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@codefast/ui/pagination";
import { useState } from "react";

const TOTAL = 5;

export function PaginationPrevNext() {
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-3 text-center">
      <Pagination>
        <PaginationContent className="justify-between gap-8">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                setPage((current) => Math.max(1, current - 1));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page === TOTAL}
              className={page === TOTAL ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                setPage((current) => Math.min(TOTAL, current + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-ui-muted">
        Page <span className="font-medium text-ui-fg">{page}</span> of {TOTAL}
      </p>
    </div>
  );
}
