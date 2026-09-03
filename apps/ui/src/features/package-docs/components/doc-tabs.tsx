import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface DocTabsProps extends ComponentProps<"nav"> {
  readonly pkg: PackageSummary;
  /** The document being read; the tab of its kind is highlighted. */
  readonly activeDoc: DocRef;
}

/** The current package's document kinds as a scrollable tab strip — the sidebar's role on screens that hide it. */
export function DocTabs({ pkg, activeDoc, className, ...props }: DocTabsProps) {
  if (pkg.docs.length < 2) {
    return null;
  }

  return (
    <nav
      aria-label={`${pkg.name} documents`}
      className={cn(
        "-mx-4 flex scrollbar-none gap-1 overflow-x-auto border-b border-ui-border/60 px-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    >
      {pkg.docs.map(({ kind }) => {
        const isActive = kind === activeDoc.kind;
        const label = DOC_KIND_BY_SLUG.get(kind)?.label ?? kind;
        const linkClassName = cn(
          "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap no-underline transition-colors",
          isActive ? "border-ui-brand font-medium text-ui-fg" : "border-transparent text-ui-muted hover:text-ui-fg",
        );

        return kind === "readme" ? (
          <Link
            key={kind}
            to="/docs/$pkg"
            params={{ pkg: pkg.slug }}
            aria-current={isActive ? "page" : undefined}
            className={linkClassName}
          >
            {label}
          </Link>
        ) : (
          <Link
            key={kind}
            to="/docs/$pkg/$kind"
            params={{ pkg: pkg.slug, kind }}
            aria-current={isActive ? "page" : undefined}
            className={linkClassName}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
