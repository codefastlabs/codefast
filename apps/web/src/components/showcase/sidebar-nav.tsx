import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { CommandPaletteHint } from "#/components/showcase/command-palette-hint";
import type { ComponentGroup } from "#/components/showcase/groups";
import { usePreloadDetail } from "#/hooks/use-preload-detail";
import { STICKY_OFFSET_BELOW_HEADER } from "#/lib/layout";

function SidebarComponentLink({ slug, name }: { slug: string; name: string }) {
  const preload = usePreloadDetail(slug);

  return (
    <Link
      to="/components/$slug"
      params={{ slug }}
      className="block truncate rounded-md px-2 py-1 text-xs text-ui-muted no-underline transition-colors duration-200 hover:bg-ui-surface hover:text-ui-fg"
      {...preload}
    >
      {name}
    </Link>
  );
}

/** Sticky left nav listing every component A–Z; each entry opens its detail page. */
export function SidebarNav({
  groups,
  activeSection,
}: {
  groups: ReadonlyArray<ComponentGroup>;
  activeSection: string | null;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activeSection || !navRef.current) {
      return;
    }

    const activeHeader = navRef.current.querySelector<HTMLElement>(`[data-group-id="${activeSection}"]`);

    activeHeader?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSection]);

  return (
    <aside className="hidden lg:block">
      <div className={cn("sticky flex max-h-[calc(100vh-6rem)] flex-col gap-4", STICKY_OFFSET_BELOW_HEADER)}>
        <nav ref={navRef} aria-label="Components" className="-me-2 min-h-0 flex-1 space-y-5 overflow-y-auto pe-2 pb-4">
          {groups.map((group) => {
            const isActive = activeSection === group.id;

            return (
              <div key={group.id}>
                <a
                  href={`#${group.id}`}
                  data-group-id={group.id}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "sticky top-0 z-10 flex items-center justify-between gap-2 border-s px-2 py-1 text-xs font-semibold tracking-wide uppercase no-underline backdrop-blur-lg backdrop-saturate-150 transition-colors duration-200",
                    isActive
                      ? "border-ui-brand bg-ui-bg/75 text-ui-fg"
                      : "border-transparent bg-ui-bg/75 text-ui-muted hover:text-ui-fg",
                  )}
                >
                  {group.label}
                  <span className="tabular-nums opacity-60">{group.items.length}</span>
                </a>
                <div className="mt-1 space-y-0.5 border-s border-ui-border/60 ps-2">
                  {group.items.map((component) => (
                    <SidebarComponentLink key={component.slug} slug={component.slug} name={component.name} />
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
