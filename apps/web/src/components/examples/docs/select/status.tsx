import { useState } from "react";
import { cn } from "@codefast/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui/select";

const STATUSES = [
  { value: "backlog", label: "Backlog", color: "bg-neutral-400" },
  { value: "todo", label: "Todo", color: "bg-blue-500" },
  { value: "in-progress", label: "In progress", color: "bg-amber-500" },
  { value: "done", label: "Done", color: "bg-emerald-500" },
  { value: "canceled", label: "Canceled", color: "bg-rose-500" },
] as const;

export function SelectStatus() {
  const [value, setValue] = useState("todo");
  const current = STATUSES.find((status) => status.value === value);

  return (
    <div className="w-full max-w-xs space-y-3">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <span className={cn("mr-2 inline-block size-2 rounded-full", status.color)} />
                {status.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <p className="text-center text-xs text-ui-muted">
        Issue status: <span className="font-medium text-ui-fg">{current?.label}</span>
      </p>
    </div>
  );
}
