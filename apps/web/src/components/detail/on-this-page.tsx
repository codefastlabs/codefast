import { cn } from "@codefast/ui/lib/utils";
import { useEffect, useState } from "react";

export interface TocItem {
  readonly id: string;
  readonly label: string;
  /** 1 = top-level section, 2 = nested (e.g. an individual example). */
  readonly depth?: 1 | 2;
}

interface OnThisPageProps {
  readonly items: ReadonlyArray<TocItem>;
}

/** Highlights the entry whose target is currently nearest the top of the view. */
function useActiveAnchor(ids: ReadonlyArray<string>): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );

    for (const id of ids) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return active;
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
      <ul className="space-y-2 border-s border-ui-border">
        {items.map((item) => {
          const isActive = active === item.id;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ms-px block border-s py-0.5 no-underline transition-colors",
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
