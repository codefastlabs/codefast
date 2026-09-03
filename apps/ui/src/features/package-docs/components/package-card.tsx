import { Badge } from "@codefast/ui/badge";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { CURRENT_PAGE_ONLY } from "#/lib/nav-links";

interface PackageCardProps extends Omit<ComponentProps<"article">, "children"> {
  readonly pkg: PackageSummary;
  /** List the package's other documents as direct links — for the docs index, where that is the point. */
  readonly showDocs?: boolean | undefined;
}

/** One published package: name, version, description, and the way into its documentation. */
export function PackageCard({ pkg, showDocs = false, className, ...props }: PackageCardProps) {
  const isUi = pkg.slug === "ui";
  const extraDocs = showDocs && !isUi ? pkg.docs.map(({ kind }) => kind).filter((kind) => kind !== "readme") : [];

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-ui-border/60 bg-ui-card p-6 transition-colors hover:border-ui-brand/60",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold text-ui-fg">{pkg.name}</h3>
        <Badge variant="outline" className="border-ui-border/60 font-mono text-xs text-ui-muted">
          v{pkg.version}
        </Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-ui-muted">{pkg.description}</p>
      {extraDocs.length > 0 ? (
        <ul className="relative z-10 flex flex-wrap gap-1.5" aria-label="Documents">
          {extraDocs.map((kind) => (
            <li key={kind}>
              <Link
                to="/docs/$pkg/$kind"
                params={{ pkg: pkg.slug, kind }}
                activeOptions={CURRENT_PAGE_ONLY}
                className="inline-flex rounded-full border border-ui-border/60 px-2.5 py-0.5 text-xs text-ui-muted no-underline transition-colors hover:border-ui-brand/60 hover:text-ui-fg"
              >
                {DOC_KIND_BY_SLUG.get(kind)?.label ?? kind}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {/* The whole card is the link; the overlay keeps the markup a plain heading + paragraph. */}
      {isUi ? (
        <Link
          to="/ui"
          activeOptions={CURRENT_PAGE_ONLY}
          className="inline-flex items-center gap-1 text-sm font-medium text-ui-brand no-underline after:absolute after:inset-0"
        >
          Component docs
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <Link
          to="/docs/$pkg"
          params={{ pkg: pkg.slug }}
          activeOptions={CURRENT_PAGE_ONLY}
          className="inline-flex items-center gap-1 text-sm font-medium text-ui-brand no-underline after:absolute after:inset-0"
        >
          Documentation
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </article>
  );
}
