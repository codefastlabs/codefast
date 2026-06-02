import { useState } from "react";
import { Button } from "@codefast/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { ArrowDownWideNarrowIcon } from "lucide-react";

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A–Z)" },
];

export function DropdownRadio() {
  const [sort, setSort] = useState("recent");
  const current = SORTS.find((option) => option.value === sort);

  return (
    <div className="space-y-3 text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <ArrowDownWideNarrowIcon data-icon="inline-start" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            {SORTS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-ui-muted">
        Sorting by: <span className="font-medium text-ui-fg">{current?.label}</span>
      </p>
    </div>
  );
}
