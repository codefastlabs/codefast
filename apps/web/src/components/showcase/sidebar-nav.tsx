import { Link } from "@tanstack/react-router";

import type { ComponentGroup } from "#/components/showcase/groups";

/** Sticky left nav listing every component A–Z; each entry opens its detail page. */
export function SidebarNav({ groups }: { groups: ReadonlyArray<ComponentGroup> }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4">
        <nav aria-label="Components" className="-me-2 min-h-0 flex-1 space-y-5 overflow-y-auto pe-2 pb-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-ui-bg/85 px-2 py-1 text-xs font-semibold tracking-wide text-ui-muted uppercase backdrop-blur-[20px]">
                {group.label}
                <span className="tabular-nums opacity-60">{group.items.length}</span>
              </p>
              <div className="mt-1 space-y-0.5 border-s border-ui-border ps-2">
                {group.items.map((component) => (
                  <Link
                    key={component.slug}
                    to="/components/$slug"
                    params={{ slug: component.slug }}
                    className="block truncate rounded-md px-2 py-1 text-xs text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
                  >
                    {component.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
