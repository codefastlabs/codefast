import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@codefast/ui/dropdown-menu";
import { cn } from "@codefast/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";

import { UI_NAV } from "#/lib/nav-links";

/** The header's "UI" group: one trigger for the `@codefast/ui` section, lit while the visitor is inside it. */
export function UiNavMenu() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const isActive = pathname === "/ui" || pathname.startsWith("/ui/");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors outline-none hover:bg-ui-surface hover:text-ui-fg focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-ui-surface data-[state=open]:text-ui-fg",
          isActive ? "bg-ui-surface font-medium text-ui-fg" : "text-ui-muted",
        )}
        aria-label="UI section"
      >
        UI
        <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {UI_NAV.map(({ to, label }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to} className="no-underline" activeOptions={{ exact: to === "/ui" }}>
              {label === "UI Overview" ? "Overview" : label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
