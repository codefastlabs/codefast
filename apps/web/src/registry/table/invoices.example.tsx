import { Badge } from "@codefast/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@codefast/ui/table";

const INVOICES = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
];

const VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  Paid: "default",
  Pending: "secondary",
  Unpaid: "destructive",
};

export function TableInvoices() {
  return (
    <Table className="w-full max-w-md">
      <TableCaption>A list of recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>
              <Badge variant={VARIANT[invoice.status] ?? "secondary"}>{invoice.status}</Badge>
            </TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right tabular-nums">$1,200.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
