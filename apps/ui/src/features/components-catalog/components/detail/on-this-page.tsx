import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { RailCurve } from "#/features/components-catalog/components/detail/rail-curve";
import type { TocItem } from "#/features/components-catalog/components/detail/toc";
import { TocLink } from "#/features/components-catalog/components/detail/toc-link";
import { useActiveAnchor } from "#/features/components-catalog/hooks/use-active-anchor";

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
