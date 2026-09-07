import { cn } from "@codefast/ui/lib/utils";
import { Link, linkOptions } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageDoc, PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { CURRENT_PAGE_ONLY } from "#/lib/nav-links";

/** `@codefast/ui` documents live in its own section, so its sidebar group lists those pages instead of markdown kinds. */
const UI_SECTION_LINKS = linkOptions([
  { to: "/ui/components", label: "Components" },
  { to: "/ui/about", label: "Getting Started" },
]);

interface DocsSidebarProps extends ComponentProps<"aside"> {
  readonly packages: ReadonlyArray<PackageSummary>;
  readonly activePkg?: string | undefined;
  /** The document being read: a directory kind unfolds its pages while it or one of them is open. */
  readonly activeDoc?: DocRef | undefined;
}

interface PackageDocEntryProps {
  readonly pkg: string;
  readonly entry: PackageDoc;
  /** The document being read, when it belongs to this package. */
  readonly activeDoc: DocRef | undefined;
}

/** One document the package ships, with its pages unfolded beneath it while it or one of them is open. */
function PackageDocEntry({ pkg, entry, activeDoc }: PackageDocEntryProps) {
  const isUnfolded = activeDoc?.kind === entry.kind && entry.pages.length > 0;

  return (
    <div>
      <Link
        to="/docs/$pkg/$kind"
        params={{ pkg, kind: entry.kind }}
        activeOptions={CURRENT_PAGE_ONLY}
        className="block rounded-md px-2 py-1 no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
        activeProps={{ className: "bg-ui-surface font-medium text-ui-fg" }}
        inactiveProps={{ className: "text-ui-muted" }}
      >
        {DOC_KIND_BY_SLUG.get(entry.kind)?.label ?? entry.kind}
      </Link>
      {isUnfolded ? (
        <div className="mt-0.5 space-y-0.5 border-s border-ui-border/60 ps-2">
          {entry.pages.map((page) => (
            <Link
              key={page}
              to="/docs/$pkg/$kind/$page"
              params={{ pkg, kind: entry.kind, page }}
              activeOptions={CURRENT_PAGE_ONLY}
              className="block truncate rounded-md px-2 py-1 font-mono text-xs no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
              activeProps={{ className: "bg-ui-surface font-medium text-ui-fg" }}
              inactiveProps={{ className: "text-ui-muted" }}
            >
              {page}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Sticky left nav: every documented package with the documents it ships; `@codefast/ui` points at its own section. */
export function DocsSidebar({ packages, activePkg, activeDoc, className, ...props }: DocsSidebarProps) {
  return (
    <aside className={cn("hidden lg:block", className)} {...props}>
      <nav
        aria-label="Packages"
        className="sticky top-below-header -me-2 max-h-[calc(100vh-var(--spacing-below-header)-1rem)] space-y-5 overflow-y-auto pe-2 pb-4 text-sm"
      >
        <div>
          <Link
            to="/ui"
            activeOptions={CURRENT_PAGE_ONLY}
            className="block rounded-md px-2 py-1 font-medium text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
          >
            @codefast/ui
          </Link>
          <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
            {UI_SECTION_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={CURRENT_PAGE_ONLY}
                className="block rounded-md px-2 py-1 text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        {packages.map((pkg) => (
          <div key={pkg.slug}>
            <Link
              to="/docs/$pkg"
              params={{ pkg: pkg.slug }}
              activeOptions={CURRENT_PAGE_ONLY}
              className="block rounded-md px-2 py-1 font-medium no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
              activeProps={{ className: "bg-ui-surface text-ui-fg" }}
              inactiveProps={{ className: "text-ui-muted" }}
            >
              {pkg.name}
            </Link>
            <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
              {pkg.docs
                .filter((entry) => entry.kind !== "readme")
                .map((entry) => (
                  <PackageDocEntry
                    key={entry.kind}
                    pkg={pkg.slug}
                    entry={entry}
                    activeDoc={pkg.slug === activePkg ? activeDoc : undefined}
                  />
                ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
