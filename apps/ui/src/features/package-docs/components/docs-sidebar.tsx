import { cn } from "@codefast/ui/lib/utils";
import { Link, linkOptions } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageDoc, PackageSummary } from "#/features/package-docs/lib/rendered-doc";

/** `@codefast/ui` documents live in its own section, so its sidebar group lists those pages instead of markdown kinds. */
const UI_SECTION_LINKS = linkOptions([
  { to: "/ui/components", label: "Components" },
  { to: "/ui/about", label: "Getting Started" },
]);

interface DocsSidebarProps extends ComponentProps<"aside"> {
  readonly packages: ReadonlyArray<PackageSummary>;
  readonly activePkg?: string | undefined;
  /** The document being read, so its kind is highlighted and, for a directory kind, its pages unfold. */
  readonly active?: DocRef | undefined;
}

interface KindEntryProps {
  readonly pkg: string;
  readonly entry: PackageDoc;
  /** The active document when it belongs to this package. */
  readonly active: DocRef | undefined;
}

/** One kind of the package, with its pages unfolded beneath it while one of them (or the kind itself) is open. */
function KindEntry({ pkg, entry, active }: KindEntryProps) {
  const isActiveKind = active?.doc === entry.doc;
  const isActive = isActiveKind && active.page === undefined;

  return (
    <div>
      <Link
        to="/docs/$pkg/$doc"
        params={{ pkg, doc: entry.doc }}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "block rounded-md px-2 py-1 no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg",
          isActive ? "bg-ui-surface font-medium text-ui-fg" : "text-ui-muted",
        )}
      >
        {DOC_KIND_BY_SLUG.get(entry.doc)?.label ?? entry.doc}
      </Link>
      {isActiveKind && entry.pages.length > 0 ? (
        <div className="mt-0.5 space-y-0.5 border-s border-ui-border/60 ps-2">
          {entry.pages.map((page) => {
            const isActivePage = active.page === page;

            return (
              <Link
                key={page}
                to="/docs/$pkg/$doc/$page"
                params={{ pkg, doc: entry.doc, page }}
                aria-current={isActivePage ? "page" : undefined}
                className={cn(
                  "block truncate rounded-md px-2 py-1 font-mono text-xs no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg",
                  isActivePage ? "bg-ui-surface font-medium text-ui-fg" : "text-ui-muted",
                )}
              >
                {page}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Sticky left nav: every documented package with the documents it ships; `@codefast/ui` points at its own section. */
export function DocsSidebar({ packages, activePkg, active, className, ...props }: DocsSidebarProps) {
  return (
    <aside className={cn("hidden lg:block", className)} {...props}>
      <nav
        aria-label="Packages"
        className="sticky top-below-header -me-2 max-h-[calc(100vh-var(--spacing-below-header)-1rem)] space-y-5 overflow-y-auto pe-2 pb-4 text-sm"
      >
        <div>
          <Link
            to="/ui"
            className="block rounded-md px-2 py-1 font-medium text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
          >
            @codefast/ui
          </Link>
          <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
            {UI_SECTION_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block rounded-md px-2 py-1 text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        {packages.map((pkg) => {
          const activeInPkg = pkg.slug === activePkg ? active : undefined;

          return (
            <div key={pkg.slug}>
              <Link
                to="/docs/$pkg"
                params={{ pkg: pkg.slug }}
                className={cn(
                  "block rounded-md px-2 py-1 font-medium no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg",
                  activeInPkg?.doc === "readme" ? "bg-ui-surface text-ui-fg" : "text-ui-muted",
                )}
              >
                {pkg.name}
              </Link>
              <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
                {pkg.docs
                  .filter((entry) => entry.doc !== "readme")
                  .map((entry) => (
                    <KindEntry key={entry.doc} pkg={pkg.slug} entry={entry} active={activeInPkg} />
                  ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
