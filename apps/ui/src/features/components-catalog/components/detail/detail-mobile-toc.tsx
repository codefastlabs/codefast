import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import type { TocItem } from "#/features/components-catalog/components/detail/toc";
import { useActiveAnchor } from "#/features/components-catalog/hooks/use-active-anchor";

interface DetailMobileTocProps extends ComponentProps<"div"> {
  readonly items: ReadonlyArray<TocItem>;
}

/** Horizontal section jump nav for detail pages on mobile and tablet. */
export function DetailMobileToc({ items, className, ...props }: DetailMobileTocProps) {
  const topLevelItems = items.filter((item) => item.depth !== 2);
  const ids = topLevelItems.map((item) => item.id);
  const active = useActiveAnchor(ids);

  if (topLevelItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-ui-bg/75 px-4 py-3 backdrop-blur-lg backdrop-saturate-150 lg:hidden", className)} {...props}>
      <nav
        className="flex scrollbar-none gap-2 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="On this page"
      >
        {topLevelItems.map((item) => {
          const isActive = active === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "flex min-h-9 shrink-0 items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap no-underline transition-colors duration-200",
                isActive
                  ? "border-ui-brand bg-ui-card text-ui-fg"
                  : "border-ui-border/60 bg-ui-surface text-ui-muted hover:border-ui-brand hover:text-ui-fg",
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
