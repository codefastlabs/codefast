import type { MouseEvent } from "react";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@codefast/ui/pagination";

const TOTAL = 10;

/** Build a windowed page list: 1 … current-1 current current+1 … last. */
function windowed(page: number): Array<number | "gap"> {
  const items: Array<number | "gap"> = [];
  for (let p = 1; p <= TOTAL; p += 1) {
    if (p === 1 || p === TOTAL || Math.abs(p - page) <= 1) {
      items.push(p);
    } else if (items[items.length - 1] !== "gap") {
      items.push("gap");
    }
  }
  return items;
}

export function PaginationControlled() {
  const [page, setPage] = useState(4);

  const go = (target: number) => (event: MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(TOTAL, Math.max(1, target)));
  };

  return (
    <div className="space-y-3 text-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={go(page - 1)}
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {windowed(page).map((item, index) =>
            item === "gap" ? (
              <PaginationItem key={`gap-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink href="#" isActive={item === page} onClick={go(item)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={go(page + 1)}
              aria-disabled={page === TOTAL}
              className={page === TOTAL ? "pointer-events-none opacity-50" : undefined}
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
