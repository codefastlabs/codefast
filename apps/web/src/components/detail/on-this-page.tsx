import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { useActiveAnchor } from "#/hooks/use-active-anchor";

export interface TocItem {
  readonly id: string;
  readonly label: string;
  /** 1 = top-level section, 2 = nested (e.g. an individual example). */
  readonly depth?: 1 | 2;
}

interface OnThisPageProps extends ComponentProps<"nav"> {
  readonly items: ReadonlyArray<TocItem>;
}

interface TocGroup {
  readonly item: TocItem;
  readonly children: ReadonlyArray<TocItem>;
}

/** Folds the flat list into top-level entries that own their depth-2 children, so the markup can nest. */
function groupByDepth(items: ReadonlyArray<TocItem>): ReadonlyArray<TocGroup> {
  const groups: Array<{ item: TocItem; children: Array<TocItem> }> = [];

  for (const item of items) {
    const parent = groups.at(-1);

    if (item.depth === 2 && parent) {
      parent.children.push(item);
    } else {
      groups.push({ item, children: [] });
    }
  }

  return groups;
}

/**
 * An S-curve that bridges the top-level rail (x≈0.5) and a nested rail (x≈12.5,
 * one `ms-3` deeper), so the guide line flows smoothly into a nested run and back
 * out. Rails are the 1px `border-s` on each link, and the curve stroke matches.
 */
function RailCurve({ direction, isActive }: { readonly direction: "in" | "out"; readonly isActive: boolean }) {
  const d = direction === "in" ? "M0.5 0 C0.5 7 12.5 5 12.5 12" : "M12.5 0 C12.5 7 0.5 5 0.5 12";

  return (
    <svg
      aria-hidden
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      className={cn("block transition-colors duration-200", isActive ? "text-ui-brand" : "text-ui-border/60")}
    >
      <path d={d} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** A rail link whose left border *is* the guide line — faint by default, brand when active. */
function TocLink({ item, isActive }: { readonly item: TocItem; readonly isActive: boolean }) {
  return (
    <a
      href={`#${item.id}`}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "block border-s py-1.5 ps-4 no-underline transition-colors duration-200",
        item.depth === 2 && "text-xs",
        isActive ? "border-ui-brand font-medium text-ui-fg" : "border-ui-border/60 text-ui-muted hover:text-ui-fg",
      )}
    >
      {item.label}
    </a>
  );
}

/** Sticky "On this page" navigation shown alongside a component detail page. */
export function OnThisPage({ items, className, ...props }: OnThisPageProps) {
  const ids = items.map((item) => item.id);
  const active = useActiveAnchor(ids);

  if (items.length === 0) {
    return null;
  }

  const groups = groupByDepth(items);

  return (
    <nav aria-label="On this page" className={cn("text-sm", className)} {...props}>
      <p className="mb-3 text-xs font-semibold tracking-widest text-ui-muted uppercase">On this page</p>
      {/* No borders on the lists: the links' left borders butt together into one rail, and the
          curves bridge each indent, so the line traces the hierarchy without a parallel trunk. */}
      <ul>
        {groups.map((group, index) => {
          const firstChild = group.children[0];
          const nextItem = groups[index + 1]?.item;

          return (
            <li key={group.item.id}>
              <TocLink item={group.item} isActive={active === group.item.id} />
              {firstChild ? (
                <>
                  <RailCurve direction="in" isActive={active === group.item.id || active === firstChild.id} />
                  <ul className="ms-3">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <TocLink item={child} isActive={active === child.id} />
                      </li>
                    ))}
                  </ul>
                  {nextItem ? (
                    <RailCurve
                      direction="out"
                      isActive={active === group.children.at(-1)?.id || active === nextItem.id}
                    />
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
