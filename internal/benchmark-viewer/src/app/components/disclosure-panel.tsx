import type { ComponentProps, ReactNode } from "react";

import { ChevronDownIcon } from "#app/components/icons";
import { cn } from "#app/lib/utils";

interface DisclosurePanelProps extends ComponentProps<"details"> {
  /** What the closed panel reads, beside the chevron that shows it opens. */
  summary: ReactNode;
}

/**
 * Renders a collapsible card whose summary carries a chevron and a visible focus ring, shared by every folding panel.
 *
 * @remarks The group is named so a table inside can keep its own unnamed `group` rows.
 *
 * @since 0.10.3
 */
export function DisclosurePanel({ summary, className, children, ...props }: DisclosurePanelProps) {
  return (
    <details
      className={cn(
        "group/disclosure border-bh-border bg-bh-surface open:bg-bh-surface-open rounded-2xl border px-4 py-3 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:px-5",
        className,
      )}
      {...props}
    >
      <summary className="text-bh-small focus-visible:outline-bh-blue flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-0.5 font-semibold text-zinc-100 select-none marker:content-[''] hover:text-white focus-visible:outline focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDownIcon className="text-bh-label-muted size-4 shrink-0 transition-transform duration-200 ease-out group-open/disclosure:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="mt-3 border-t border-white/6 pt-3">{children}</div>
    </details>
  );
}
