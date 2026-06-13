import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import type { ComponentMeta } from "#/registry/components";

interface ComponentPagerProps {
  readonly previous?: ComponentMeta | undefined;
  readonly next?: ComponentMeta | undefined;
}

/** Previous / next navigation between adjacent components in the registry. */
export function ComponentPager({ previous, next }: ComponentPagerProps) {
  return (
    <nav className="grid gap-4 border-t border-ui-border pt-8 sm:grid-cols-2">
      {previous ? (
        <Link
          to="/components/$slug"
          params={{ slug: previous.slug }}
          className="group flex flex-col gap-1 rounded-xl border border-ui-border p-4 no-underline transition-colors hover:border-ui-brand"
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
          className="group flex flex-col items-end gap-1 rounded-xl border border-ui-border p-4 text-end no-underline transition-colors hover:border-ui-brand sm:col-start-2"
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
