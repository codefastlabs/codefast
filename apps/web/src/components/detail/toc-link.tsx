import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import type { TocItem } from "#/components/detail/toc";

interface TocLinkProps extends ComponentProps<"a"> {
  readonly item: TocItem;
  readonly isActive: boolean;
}

/** A rail link whose left border *is* the guide line — faint by default, brand when active. */
export function TocLink({ item, isActive, className, ...props }: TocLinkProps) {
  return (
    <a
      href={`#${item.id}`}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "block border-s py-1.5 ps-4 no-underline transition-colors duration-200",
        item.depth === 2 && "text-xs",
        isActive ? "border-ui-brand font-medium text-ui-fg" : "border-ui-border/60 text-ui-muted hover:text-ui-fg",
        className,
      )}
      {...props}
    >
      {item.label}
    </a>
  );
}
