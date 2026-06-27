import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/table";

import preview from "../.storybook/preview";

/**
 * Table — a LAYOUT-ONLY composite. Every part is a thin styled wrapper over its
 * native HTML table element (`<table>`, `<thead>`, `<tr>`, `<th>`, `<td>`…), so the
 * root owns no enum/boolean/number props of its own and correctly exposes no Controls.
 * The single flat `withFooter` arg toggles the footer row so both states reuse one
 * render. Content here is authored for Storybook and is NOT synced with the apps/web registry.
 */
interface TableArgs {
  withFooter: boolean;
}

const invoices = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
];

const meta = preview.type<{ args: TableArgs }>().meta({
  args: { withFooter: false },
  argTypes: {
    withFooter: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A styled, responsive wrapper around the native HTML table elements. `Table` adds a horizontally scrollable container; each remaining part maps to its semantic element.",
          "",
          "**Anatomy:** `Table > (TableCaption + TableHeader (TableRow > TableHead) + TableBody (TableRow > TableCell) + TableFooter)`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow },
  title: "Display/Table",
});

export const Default = meta.story({
  render: ({ withFooter }) => {
    const rows = withFooter ? invoices.slice(0, 3) : invoices;

    return (
      <Table className="w-full max-w-lg">
        <TableCaption>A list of recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.id}</TableCell>
              <TableCell>{inv.status}</TableCell>
              <TableCell>{inv.method}</TableCell>
              <TableCell className="text-end">{inv.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {withFooter ? (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-end">$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    );
  },
});

export const WithFooter = meta.story({
  args: { withFooter: true },
  render: Default.input.render,
});
