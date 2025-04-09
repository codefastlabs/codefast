import type { ComponentProps, JSX } from "react";

import { Label, SidebarGroup, SidebarGroupContent, SidebarInput } from "@codefast/ui";
import { SearchIcon } from "lucide-react";

export function SearchForm({ ...props }: ComponentProps<"form">): JSX.Element {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label className="sr-only" htmlFor="search">
            Search
          </Label>
          <SidebarInput className="pl-8" id="search" placeholder="Search the docs..." />
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
