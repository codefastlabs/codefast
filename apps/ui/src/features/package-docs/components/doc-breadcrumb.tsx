import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface DocBreadcrumbProps extends ComponentProps<"nav"> {
  readonly pkg: PackageSummary;
  /** The current document's label, shown as the last crumb; omit on the package's own page. */
  readonly current?: string | undefined;
}

/** `Packages › @codefast/di › Specification` — the way back up from any doc page. */
export function DocBreadcrumb({ pkg, current, className, ...props }: DocBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6 text-sm text-ui-muted", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/docs" className="no-underline hover:text-ui-fg">
            Packages
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRightIcon className="size-3.5" />
        </li>
        <li>
          {current ? (
            <Link to="/docs/$pkg" params={{ pkg: pkg.slug }} className="no-underline hover:text-ui-fg">
              {pkg.name}
            </Link>
          ) : (
            <span aria-current="page" className="text-ui-fg">
              {pkg.name}
            </span>
          )}
        </li>
        {current ? (
          <>
            <li aria-hidden>
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li aria-current="page" className="text-ui-fg">
              {current}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
