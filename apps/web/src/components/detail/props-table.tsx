import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";

export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description: string;
}

interface PropsTableProps {
  readonly rows: ReadonlyArray<PropRow>;
}

/** API reference table: Prop · Type · Default · Description. */
export function PropsTable({ rows }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ui-border/60">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22%]">Prop</TableHead>
            <TableHead className="w-[34%]">Type</TableHead>
            <TableHead className="w-[16%]">Default</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="align-top font-mono text-xs font-medium text-ui-brand">{row.name}</TableCell>
              <TableCell className="align-top font-mono text-xs whitespace-pre-wrap text-ui-fg">{row.type}</TableCell>
              <TableCell className="align-top font-mono text-xs text-ui-muted">{row.default ?? "—"}</TableCell>
              <TableCell className="align-top text-sm leading-relaxed text-ui-muted">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
