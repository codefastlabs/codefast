import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";

const MEMBERS = [
  { name: "Ada Lovelace", role: "Owner", email: "ada@example.com" },
  { name: "Alan Turing", role: "Admin", email: "alan@example.com" },
  { name: "Grace Hopper", role: "Member", email: "grace@example.com" },
];

export function TableSimple() {
  return (
    <Table className="w-full max-w-md">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.map((member) => (
          <TableRow key={member.email}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell className="text-ui-muted">{member.role}</TableCell>
            <TableCell className="text-ui-muted">{member.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
