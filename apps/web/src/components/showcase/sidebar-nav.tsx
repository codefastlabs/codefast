import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { LocateFixedIcon } from "lucide-react";
import { useRef } from "react";

import { CommandPaletteHint } from "#/components/showcase/command-palette-hint";
import type { ComponentGroup } from "#/data/showcase";
import { useScrollActiveIntoView } from "#/hooks/use-scroll-active-into-view";

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

function SidebarGroupHeader({
  group,
  active,
  jumpToBand,
}: {
  group: ComponentGroup;
  active: boolean;
  /** Gallery: render as an in-page jump link to the letter band. Detail: a static label. */
  jumpToBand: boolean;
}) {
  const content = (
    <>
      {group.label}
      <span className="tabular-nums opacity-60">{group.items.length}</span>
    </>
  );

  if (jumpToBand) {
    return (
      <a
        href={`#${group.id}`}
        data-group-id={group.id}
        aria-current={active ? "location" : undefined}
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-2 border-s bg-ui-bg/75 px-2 py-1 text-xs font-semibold tracking-wide uppercase no-underline backdrop-blur-lg backdrop-saturate-150 transition-colors duration-200 hover:text-ui-fg",
          active ? "border-ui-brand text-ui-fg" : "border-transparent text-ui-muted",
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <p
      data-group-id={group.id}
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-2 border-s bg-ui-bg/75 px-2 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-lg backdrop-saturate-150 transition-colors duration-200",
        active ? "border-ui-brand text-ui-fg" : "border-transparent text-ui-muted",
      )}
    >
      {content}
    </p>
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

  // Detail: scroll the current component's link in; gallery: the active letter band's header.
  const activeSelector = activeSlug
    ? `[data-slug="${activeSlug}"]`
    : activeGroupId
      ? `[data-group-id="${activeGroupId}"]`
      : null;

  useScrollActiveIntoView(navRef, activeSelector);

  return (
    <aside className="hidden lg:block">
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
