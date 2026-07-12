import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useRef } from "react";

import { CommandPaletteHint } from "#/features/components-catalog/components/gallery/command-palette-hint";
import { SidebarComponentLink } from "#/features/components-catalog/components/gallery/sidebar-component-link";
import { SidebarGroupHeader } from "#/features/components-catalog/components/gallery/sidebar-group-header";
import type { ComponentGroup } from "#/features/components-catalog/data";
import { useScrollActiveIntoView } from "#/features/components-catalog/hooks/use-scroll-active-into-view";

interface SidebarNavProps extends ComponentProps<"aside"> {
  readonly groups: ReadonlyArray<ComponentGroup>;
  /** Gallery: id of the letter band currently in view — highlighted and scrolled into view. */
  readonly activeSection?: string | null;
  /** Detail: slug of the component being viewed — its link is highlighted and scrolled into view. */
  readonly activeSlug?: string;
}

/**
 * Sticky left nav listing every component A–Z; each entry opens its detail page.
 * Shared by the gallery (highlights the in-view letter band) and the detail page
 * (highlights the current component). Letter headers jump to the gallery band, so
 * they work from either page.
 */
export function SidebarNav({ groups, activeSection = null, activeSlug, className, ...props }: SidebarNavProps) {
  const navRef = useRef<HTMLElement>(null);

  const activeGroupId = activeSlug
    ? (groups.find((group) => group.items.some((item) => item.slug === activeSlug))?.id ?? null)
    : activeSection;

  // Detail: scroll the current component's link in; gallery: the active letter band's header.
  const activeSelector = activeSlug
    ? `[data-slug="${activeSlug}"]`
    : activeGroupId
      ? `[data-group-id="${activeGroupId}"]`
      : null;

  useScrollActiveIntoView(navRef, activeSelector);

  return (
    <aside className={cn("hidden lg:block", className)} {...props}>
      <div className="sticky top-below-header flex max-h-[calc(100vh-var(--spacing-below-header)-1rem)] flex-col gap-4">
        <nav ref={navRef} aria-label="Components" className="-me-2 min-h-0 flex-1 space-y-5 overflow-y-auto pe-2 pb-4">
          {groups.map((group) => {
            const isActive = activeGroupId === group.id;

            return (
              <div key={group.id}>
                {/* Gallery: in-page jump to the letter band. Detail: a static label (no bands to jump to). */}
                <SidebarGroupHeader group={group} active={isActive} jumpToBand={activeSlug === undefined} />
                <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
                  {group.items.map((component) => (
                    <SidebarComponentLink
                      key={component.slug}
                      slug={component.slug}
                      name={component.name}
                      active={component.slug === activeSlug}
                      showScrollTo={activeSlug === undefined}
                      isNew={component.isNew}
                      surface={activeSlug === undefined ? "gallery-sidebar" : "detail-sidebar"}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <CommandPaletteHint className="shrink-0 pe-2 text-[11px] leading-relaxed text-ui-muted" />
      </div>
    </aside>
  );
}
