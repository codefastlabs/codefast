import { Checkbox } from "@codefast/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";
import { useState } from "react";

const ROWS = [
  { id: "u1", name: "Ada Lovelace", role: "Owner" },
  { id: "u2", name: "Alan Turing", role: "Admin" },
  { id: "u3", name: "Grace Hopper", role: "Member" },
];

export function TableSelection() {
  const [selected, setSelected] = useState<ReadonlyArray<string>>(["u1"]);

  const allSelected = selected.length === ROWS.length;

  function toggleAll(checked: boolean) {
    setSelected(checked ? ROWS.map((row) => row.id) : []);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((rowId) => rowId !== id),
    );
  }

  return (
    <Table className="w-full max-w-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              aria-label="Select all"
              checked={allSelected}
              onCheckedChange={(checked) => {
                toggleAll(checked === true);
              }}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.id} data-state={selected.includes(row.id) ? "selected" : undefined}>
            <TableCell>
              <Checkbox
                aria-label={`Select ${row.name}`}
                checked={selected.includes(row.id)}
                onCheckedChange={(checked) => {
                  toggleRow(row.id, checked === true);
                }}
              />
            </TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="text-ui-muted">{row.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
