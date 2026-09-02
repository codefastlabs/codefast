import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface DocPagerProps extends ComponentProps<"nav"> {
  readonly pkg: PackageSummary;
  readonly activeDoc: DocKindSlug;
}

interface PagerLinkProps {
  readonly pkg: string;
  readonly doc: DocKindSlug;
  readonly direction: "previous" | "next";
}

function PagerLink({ pkg, doc, direction }: PagerLinkProps) {
  const label = DOC_KIND_BY_SLUG.get(doc)?.label ?? doc;
  const className = cn(
    "flex flex-1 flex-col gap-1 rounded-xl border border-ui-border/60 p-4 no-underline transition-colors hover:border-ui-brand/60",
    direction === "next" && "items-end text-end",
  );
  const body = (
    <>
      <span className="flex items-center gap-1 text-xs text-ui-muted">
        {direction === "previous" ? <ArrowLeftIcon className="size-3.5" /> : null}
        {direction === "previous" ? "Previous" : "Next"}
        {direction === "next" ? <ArrowRightIcon className="size-3.5" /> : null}
      </span>
      <span className="text-sm font-medium text-ui-fg">{label}</span>
    </>
  );

  return doc === "readme" ? (
    <Link to="/docs/$pkg" params={{ pkg }} className={className}>
      {body}
    </Link>
  ) : (
    <Link to="/docs/$pkg/$doc" params={{ pkg, doc }} className={className}>
      {body}
    </Link>
  );
}

/** Previous/next links through the package's documents, in sidebar order, at the end of a doc page. */
export function DocPager({ pkg, activeDoc, className, ...props }: DocPagerProps) {
  const index = pkg.docs.indexOf(activeDoc);
  const previous = index > 0 ? pkg.docs[index - 1] : undefined;
  const next = index >= 0 ? pkg.docs[index + 1] : undefined;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="Document pager"
      className={cn("mt-16 flex gap-4 border-t border-ui-border/60 pt-8", className)}
      {...props}
    >
      {previous ? <PagerLink pkg={pkg.slug} doc={previous} direction="previous" /> : <div className="flex-1" />}
      {next ? <PagerLink pkg={pkg.slug} doc={next} direction="next" /> : <div className="flex-1" />}
    </nav>
  );
}
