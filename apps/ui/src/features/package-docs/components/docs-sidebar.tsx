import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface DocsSidebarProps extends ComponentProps<"aside"> {
  readonly packages: ReadonlyArray<PackageSummary>;
  readonly activePkg?: string | undefined;
  readonly activeDoc?: DocKindSlug | undefined;
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
            to="/components"
            className="block rounded-md px-2 py-1 font-medium text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
          >
            @codefast/ui
          </Link>
          <p className="px-2 text-xs text-ui-muted">Component docs live in the gallery.</p>
        </div>
        {packages.map((pkg) => {
          const isActivePkg = pkg.slug === activePkg;

          return (
            <div key={pkg.slug}>
              <Link
                to="/docs/$pkg"
                params={{ pkg: pkg.slug }}
                className={cn(
                  "block rounded-md px-2 py-1 font-medium no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg",
                  isActivePkg && activeDoc === "readme" ? "bg-ui-surface text-ui-fg" : "text-ui-muted",
                )}
              >
                {pkg.name}
              </Link>
              <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
                {pkg.docs
                  .filter((doc) => doc !== "readme")
                  .map((doc) => {
                    const isActive = isActivePkg && doc === activeDoc;

                    return (
                      <Link
                        key={doc}
                        to="/docs/$pkg/$doc"
                        params={{ pkg: pkg.slug, doc }}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-2 py-1 no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg",
                          isActive ? "bg-ui-surface font-medium text-ui-fg" : "text-ui-muted",
                        )}
                      >
                        {DOC_KIND_BY_SLUG.get(doc)?.label ?? doc}
                      </Link>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
