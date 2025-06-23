import { Label, SidebarInput } from "@codefast/ui";
import { SearchIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";
import { useId } from "react";

export function SearchForm({ ...props }: ComponentProps<"form">): JSX.Element {
  const id = useId();
  return (
    <form {...props}>
      <div className="relative">
        <Label className="sr-only" htmlFor={`${id}-search`}>
          Search
        </Label>
        <SidebarInput className="h-8 pl-7" id={`${id}-search`} placeholder="Type to search..." />
        <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
      </div>
    </form>
  );
}
