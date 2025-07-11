import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

function Table({ className, ...props }: ComponentProps<"table">): JSX.Element {
  return (
    <div className="relative w-full overflow-auto" data-slot="table-cotainer">
      <table className={cn("w-full caption-bottom text-sm", className)} data-slot="table" {...props} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHeader
 * -------------------------------------------------------------------------- */

function TableHeader({ className, ...props }: ComponentProps<"thead">): JSX.Element {
  return (
    <thead
      className={cn("*:has-aria-expanded:bg-transparent *:border-b", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

function TableBody({ className, ...props }: ComponentProps<"tbody">): JSX.Element {
  return <tbody className={cn("*:last-child:border-0", className)} data-slot="table-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableFooter
 * -------------------------------------------------------------------------- */

function TableFooter({ className, ...props }: ComponentProps<"tfoot">): JSX.Element {
  return (
    <tfoot
      className={cn("bg-muted/50 *:has-aria-expanded:bg-transparent font-medium *:border-b-0 *:border-t", className)}
      data-slot="table-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableRow
 * -------------------------------------------------------------------------- */

function TableRow({ className, ...props }: ComponentProps<"tr">): JSX.Element {
  return (
    <tr
      className={cn(
        "hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHead
 * -------------------------------------------------------------------------- */

function TableHead({ className, ...props }: ComponentProps<"th">): JSX.Element {
  return <th className={cn("p-2 text-left align-middle font-medium", className)} data-slot="table-head" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableCell
 * -------------------------------------------------------------------------- */

function TableCell({ className, ...props }: ComponentProps<"td">): JSX.Element {
  return <td className={cn("p-2 align-middle", className)} data-slot="table-cell" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

function TableCaption({ className, ...props }: ComponentProps<"caption">): JSX.Element {
  return (
    <caption className={cn("text-muted-foreground mt-4 text-sm", className)} data-slot="table-caption" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
