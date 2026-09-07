import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { cn } from "@codefast/ui/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";
import type { ComponentProps } from "react";
import { Fragment } from "react";

export interface KeyRow {
  /** One or more keys pressed together, e.g. ["Shift", "Tab"] or ["Space"]. */
  readonly keys: ReadonlyArray<string>;
  readonly description: string;
}

interface KeyboardTableProps extends ComponentProps<"div"> {
  readonly rows: ReadonlyArray<KeyRow>;
}

/** Accessibility reference: keyboard interactions rendered with Kbd. */
export function KeyboardTable({ rows, className, ...props }: KeyboardTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-ui-border/60", className)} {...props}>
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Key</TableHead>
            <TableHead>Function</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.keys.join("+")}>
              <TableCell className="align-top">
                <KbdGroup>
                  {row.keys.map((key, index) => (
                    <Fragment key={key}>
                      {index > 0 ? <span className="text-ui-muted">+</span> : null}
                      <Kbd>{key}</Kbd>
                    </Fragment>
                  ))}
                </KbdGroup>
              </TableCell>
              <TableCell className="align-top text-sm leading-relaxed text-ui-muted">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
