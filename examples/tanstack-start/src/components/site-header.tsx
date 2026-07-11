import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactElement } from "react";

import { AppearanceToggle } from "#/components/appearance-toggle";

type SiteHeaderProps = ComponentProps<"header">;

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/ui", label: "UI" },
  { to: "/variants", label: "Variants" },
  { to: "/di", label: "DI" },
  { to: "/playground", label: "Playground" },
] as const;

export function SiteHeader({ className, ...props }: SiteHeaderProps): ReactElement {
  return (
    <header
      className={cn("sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur", className)}
      {...props}
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="font-mono text-sm font-semibold" to="/">
          codefast<span className="text-muted-foreground">/start-demo</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          <AppearanceToggle className="ml-2" />
        </nav>
      </div>
    </header>
  );
}
