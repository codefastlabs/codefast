import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import { isSameDoc, packagePages } from "#/features/package-docs/lib/package-pages";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface DocPagerProps extends ComponentProps<"nav"> {
  readonly pkg: PackageSummary;
  readonly active: DocRef;
}

interface PagerLinkProps {
  readonly pkg: string;
  readonly target: DocRef;
  readonly direction: "previous" | "next";
}

/** The kind's label for its own page; a page beneath a kind is named by its path, as in the sidebar. */
function pagerLabel({ doc, page }: DocRef): string {
  return page ?? DOC_KIND_BY_SLUG.get(doc)?.label ?? doc;
}

function PagerLink({ pkg, target, direction }: PagerLinkProps) {
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
      <span className="text-sm font-medium text-ui-fg">{pagerLabel(target)}</span>
    </>
  );

  if (target.page !== undefined) {
    return (
      <Link to="/docs/$pkg/$doc/$page" params={{ pkg, doc: target.doc, page: target.page }} className={className}>
        {body}
      </Link>
    );
  }

  return target.doc === "readme" ? (
    <Link to="/docs/$pkg" params={{ pkg }} className={className}>
      {body}
    </Link>
  ) : (
    <Link to="/docs/$pkg/$doc" params={{ pkg, doc: target.doc }} className={className}>
      {body}
    </Link>
  );
}

/** Previous/next links through the package's documents, in sidebar order, at the end of a doc page. */
export function DocPager({ pkg, active, className, ...props }: DocPagerProps) {
  const pages = packagePages(pkg);
  const index = pages.findIndex((candidate) => isSameDoc(candidate, active));
  const previous = index > 0 ? pages[index - 1] : undefined;
  const next = index >= 0 ? pages[index + 1] : undefined;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="Document pager"
      className={cn("mt-16 flex gap-4 border-t border-ui-border/60 pt-8", className)}
      {...props}
    >
      {previous ? <PagerLink pkg={pkg.slug} target={previous} direction="previous" /> : <div className="flex-1" />}
      {next ? <PagerLink pkg={pkg.slug} target={next} direction="next" /> : <div className="flex-1" />}
    </nav>
  );
}
