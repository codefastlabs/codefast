import { cn } from "@codefast/ui/lib/utils";
import { useEffect, useRef } from "react";

import type { ComponentGroup } from "#/components/showcase/groups";
import type { ViewMode } from "#/components/showcase/types";
import { ViewToggle } from "#/components/showcase/view-toggle";
import type { ComponentMeta } from "#/registry/components";

/** A single component entry in the sidebar; anchors to its on-page card, or
 *  links out to the detail page for docs-only components. */
function SidebarLink({ component, isActive }: { component: ComponentMeta; isActive: boolean }) {
  const className = cn(
    "block truncate rounded-md px-2 py-1 text-xs no-underline transition-colors",
    isActive ? "bg-ui-surface font-medium text-ui-fg" : "text-ui-muted hover:bg-ui-surface hover:text-ui-fg",
  );

  return (
    <a href={`#${component.slug}`} aria-current={isActive ? "location" : undefined} className={className}>
      {component.name}
    </a>
  );
}

/** Sticky left nav listing every component grouped by the active view mode. */
export function SidebarNav({
  groups,
  activeSection,
  mode,
  onModeChange,
}: {
  groups: ReadonlyArray<ComponentGroup>;
  activeSection: string | null;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  const navRef = useRef<HTMLElement>(null);

  // Keep the active group visible as the page scrolls, adjusting only the nav's
  // own scroll (never the window). Also corrects any stale restored scrollTop.
  useEffect(() => {
    const nav = navRef.current;

    if (!nav || !activeSection) {
      return;
    }

    const link = nav.querySelector(`a[href="#${activeSection}"]`);

    if (!(link instanceof HTMLElement)) {
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    if (linkRect.top < navRect.top) {
      nav.scrollTop -= navRect.top - linkRect.top + 8;
    } else if (linkRect.bottom > navRect.bottom) {
      nav.scrollTop += linkRect.bottom - navRect.bottom + 8;
    }
  }, [activeSection]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4">
        <ViewToggle value={mode} onChange={onModeChange} />
        <nav ref={navRef} aria-label="Components" className="-me-2 min-h-0 flex-1 space-y-5 overflow-y-auto pe-2 pb-4">
          {groups.map((group) => {
            const isActive = activeSection === group.id;

            return (
              <div key={group.id}>
                <a
                  href={`#${group.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs font-semibold tracking-wide uppercase no-underline transition-colors",
                    isActive ? "text-ui-fg" : "text-ui-muted hover:text-ui-fg",
                  )}
                >
                  {group.label}
                  <span className="tabular-nums opacity-60">{group.items.length}</span>
                </a>
                <div className="mt-1 space-y-0.5 border-s border-ui-border ps-2">
                  {group.items.map((component) => (
                    <SidebarLink
                      key={component.slug}
                      component={component}
                      isActive={activeSection === component.slug}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
