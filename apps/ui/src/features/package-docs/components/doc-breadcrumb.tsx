import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";
import type { ComponentProps } from "react";

import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

/** A linked crumb between the package and the current document: a directory kind above one of its pages. */
export interface BreadcrumbTrailItem {
  readonly doc: DocKindSlug;
  readonly label: string;
}

interface DocBreadcrumbProps extends ComponentProps<"nav"> {
  readonly pkg: PackageSummary;
  /** Linked crumbs between the package and the current document; empty when the document sits directly under it. */
  readonly trail?: ReadonlyArray<BreadcrumbTrailItem> | undefined;
  /** The current document's label, shown as the last crumb; omit on the package's own page. */
  readonly current?: string | undefined;
}

/** `Packages › @codefast/tracking › Specification › spec-consent` — the way back up from any doc page. */
export function DocBreadcrumb({ pkg, trail = [], current, className, ...props }: DocBreadcrumbProps) {
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
        {trail.map((item) => (
          <Fragment key={item.doc}>
            <li aria-hidden>
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li>
              <Link
                to="/docs/$pkg/$doc"
                params={{ pkg: pkg.slug, doc: item.doc }}
                className="no-underline hover:text-ui-fg"
              >
                {item.label}
              </Link>
            </li>
          </Fragment>
        ))}
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
