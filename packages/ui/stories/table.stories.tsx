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

const meta = preview.meta({
  component: Table,
  subcomponents: { TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption },
  parameters: {
    docs: {
      description: {
        component: [
          "A styled, responsive wrapper around the native HTML table elements.",
          "",
          "**Anatomy:** `Table > (TableCaption + TableHeader (TableRow > TableHead) + TableBody (TableRow > TableCell) + TableFooter)`.",
          "Each part maps to its semantic element (`<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`…); `Table` adds a horizontally scrollable container.",
        ].join("\n"),
      },
    },
  },
  title: "Display/Table",
});

const invoices = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  {
    id: "INV003",
    status: "Unpaid",
    method: "Bank Transfer",
    amount: "$350.00",
  },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
];

export const Default = meta.story({
  render: () => (
    <Table className="w-full max-w-lg">
      <TableCaption>A list of recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.status}</TableCell>
            <TableCell>{inv.method}</TableCell>
            <TableCell className="text-end">{inv.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
});

export const WithFooter = meta.story({
  render: () => (
    <Table className="w-full max-w-lg">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 3).map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.status}</TableCell>
            <TableCell>{inv.method}</TableCell>
            <TableCell className="text-end">{inv.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-end">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
});
