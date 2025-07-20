import type { ComponentProps, JSX } from "react";

import { Search } from "lucide-react";
import { useId } from "react";

import { Label, SidebarInput } from "@codefast/ui";

export function SearchForm({ ...props }: ComponentProps<"form">): JSX.Element {
  const id = useId();

  return (
    <form {...props}>
      <div className="relative">
        <Label className="sr-only" htmlFor={`${id}-search`}>
          Search
        </Label>
        <SidebarInput className="h-8 pl-7" id={`${id}-search`} placeholder="Type to search..." />
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
      </div>
    </form>
  );
}
