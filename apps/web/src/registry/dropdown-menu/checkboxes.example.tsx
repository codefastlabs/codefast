import { Button } from "@codefast/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";

const COLUMNS = [
  { id: "status", label: "Status" },
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
];

export function DropdownCheckboxes() {
  const [visible, setVisible] = useState<Record<string, boolean>>({
    status: true,
    email: true,
    role: false,
  });

  const count = Object.values(visible).filter(Boolean).length;

  return (
    <div className="space-y-3 text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontalIcon data-icon="inline-start" />
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visible[column.id] ?? false}
              onCheckedChange={(value) => {
                setVisible((previous) => ({ ...previous, [column.id]: value }));
              }}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-ui-muted">
        {count} column{count === 1 ? "" : "s"} visible
      </p>
    </div>
  );
}
