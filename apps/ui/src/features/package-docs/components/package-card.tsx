import { Badge } from "@codefast/ui/badge";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface PackageCardProps extends Omit<ComponentProps<"article">, "children"> {
  readonly pkg: PackageSummary;
}

/** One published package: name, version, description, and the way into its documentation. */
export function PackageCard({ pkg, className, ...props }: PackageCardProps) {
  const isUi = pkg.slug === "ui";

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
      {/* The whole card is the link; the overlay keeps the markup a plain heading + paragraph. */}
      {isUi ? (
        <Link
          to="/components"
          className="inline-flex items-center gap-1 text-sm font-medium text-ui-brand no-underline after:absolute after:inset-0"
        >
          Component docs
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <Link
          to="/docs/$pkg"
          params={{ pkg: pkg.slug }}
          className="inline-flex items-center gap-1 text-sm font-medium text-ui-brand no-underline after:absolute after:inset-0"
        >
          Documentation
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </article>
  );
}
