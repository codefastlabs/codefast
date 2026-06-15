import { cn } from "@codefast/ui/lib/utils";

import { useActiveAnchor } from "#/hooks/use-active-anchor";

export interface TocItem {
  readonly id: string;
  readonly label: string;
  /** 1 = top-level section, 2 = nested (e.g. an individual example). */
  readonly depth?: 1 | 2;
}

interface OnThisPageProps {
  readonly items: ReadonlyArray<TocItem>;
}

/** Sticky "On this page" navigation shown alongside a component detail page. */
export function OnThisPage({ items }: OnThisPageProps) {
  const ids = items.map((item) => item.id);
  const active = useActiveAnchor(ids);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold tracking-widest text-ui-muted uppercase">On this page</p>
      <ul className="space-y-2 border-s border-ui-border/60">
        {items.map((item) => {
          const isActive = active === item.id;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ms-px block border-s py-0.5 no-underline transition-colors duration-200",
                  item.depth === 2 ? "ps-6" : "ps-4",
                  isActive
                    ? "border-ui-brand font-medium text-ui-fg"
                    : "border-transparent text-ui-muted hover:text-ui-fg",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
