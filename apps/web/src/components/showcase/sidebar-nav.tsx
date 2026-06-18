import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { LocateFixedIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { CommandPaletteHint } from "#/components/showcase/command-palette-hint";
import type { ComponentGroup } from "#/data/showcase";

function SidebarComponentLink({
  slug,
  name,
  active,
  showScrollTo,
}: {
  slug: string;
  name: string;
  active?: boolean;
  /** Gallery only — reveals a hover action that scrolls to the component's card in place. */
  showScrollTo?: boolean;
}) {
  return (
    <div className={cn("group/item flex items-center rounded-md", active ? "bg-ui-surface" : "hover:bg-ui-surface")}>
      <Link
        to="/components/$slug"
        params={{ slug }}
        data-slug={slug}
        aria-current={active ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs no-underline",
          active ? "font-medium text-ui-fg" : "text-ui-muted group-hover/item:text-ui-fg",
        )}
      >
        {name}
      </Link>
      {showScrollTo ? (
        <a
          href={`#${slug}`}
          aria-label={`Scroll to ${name} in the gallery`}
          title={`Scroll to ${name}`}
          className="me-1 flex size-5 shrink-0 items-center justify-center rounded text-ui-muted opacity-0 transition-[opacity,color] duration-200 group-hover/item:opacity-100 hover:text-ui-fg focus-visible:opacity-100"
        >
          <LocateFixedIcon className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

interface SidebarNavProps {
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
export function SidebarNav({ groups, activeSection = null, activeSlug }: SidebarNavProps) {
  const navRef = useRef<HTMLElement>(null);

  const activeGroupId = activeSlug
    ? (groups.find((group) => group.items.some((item) => item.slug === activeSlug))?.id ?? null)
    : activeSection;

  useEffect(() => {
    const nav = navRef.current;

    if (!nav) {
      return;
    }

    const target = activeSlug
      ? nav.querySelector<HTMLElement>(`[data-slug="${activeSlug}"]`)
      : activeGroupId
        ? nav.querySelector<HTMLElement>(`[data-group-id="${activeGroupId}"]`)
        : null;

    if (!target) {
      return;
    }

    // Scroll only this nav's own overflow container into place — never the page.
    // (scrollIntoView would also scroll the window, yanking a detail page on load.)
    const navRect = nav.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.top < navRect.top
        ? targetRect.top - navRect.top
        : targetRect.bottom > navRect.bottom
          ? targetRect.bottom - navRect.bottom
          : 0;

    if (delta !== 0) {
      nav.scrollBy({ top: delta, behavior: "smooth" });
    }
  }, [activeSlug, activeGroupId]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-below-header flex max-h-[calc(100vh-var(--spacing-below-header)-1rem)] flex-col gap-4">
        <nav ref={navRef} aria-label="Components" className="-me-2 min-h-0 flex-1 space-y-5 overflow-y-auto pe-2 pb-4">
          {groups.map((group) => {
            const isActive = activeGroupId === group.id;
            const headerClassName = cn(
              "sticky top-0 z-10 flex items-center justify-between gap-2 border-s bg-ui-bg/75 px-2 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-lg backdrop-saturate-150 transition-colors duration-200",
              isActive ? "border-ui-brand text-ui-fg" : "border-transparent text-ui-muted",
            );
            const headerContent = (
              <>
                {group.label}
                <span className="tabular-nums opacity-60">{group.items.length}</span>
              </>
            );

            return (
              <div key={group.id}>
                {/* Gallery: in-page jump to the letter band. Detail: a static label (no bands to jump to). */}
                {activeSlug === undefined ? (
                  <a
                    href={`#${group.id}`}
                    data-group-id={group.id}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(headerClassName, "no-underline hover:text-ui-fg")}
                  >
                    {headerContent}
                  </a>
                ) : (
                  <p data-group-id={group.id} className={headerClassName}>
                    {headerContent}
                  </p>
                )}
                <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
                  {group.items.map((component) => (
                    <SidebarComponentLink
                      key={component.slug}
                      slug={component.slug}
                      name={component.name}
                      active={component.slug === activeSlug}
                      showScrollTo={activeSlug === undefined}
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
