import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { ComponentMeta } from "#/registry/components";

interface ComponentPagerProps extends ComponentProps<"nav"> {
  readonly previous?: ComponentMeta | undefined;
  readonly next?: ComponentMeta | undefined;
}

/** Previous / next navigation between adjacent components in the registry. */
export function ComponentPager({ previous, next, className, ...props }: ComponentPagerProps) {
  return (
    <nav className={cn("grid gap-4 sm:grid-cols-2", className)} {...props}>
      {previous ? (
        <Link
          to="/components/$slug"
          params={{ slug: previous.slug }}
          className="group flex flex-col gap-1 rounded-xl border border-ui-border/60 p-4 no-underline transition-colors duration-200 hover:border-ui-brand"
        >
          <span className="flex items-center gap-1.5 text-xs text-ui-muted">
            <ArrowLeftIcon className="size-3.5" />
            Previous
          </span>
          <span className="text-sm font-semibold text-ui-fg group-hover:text-ui-brand">{previous.name}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to="/components/$slug"
          params={{ slug: next.slug }}
          className="group flex flex-col items-end gap-1 rounded-xl border border-ui-border/60 p-4 text-end no-underline transition-colors duration-200 hover:border-ui-brand sm:col-start-2"
        >
          <span className="flex items-center gap-1.5 text-xs text-ui-muted">
            Next
            <ArrowRightIcon className="size-3.5" />
          </span>
          <span className="text-sm font-semibold text-ui-fg group-hover:text-ui-brand">{next.name}</span>
        </Link>
      ) : null}
    </nav>
  );
}
