import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

import type { ComponentGroup } from "#/components/showcase/groups";

/** A pill link used in the mobile jump nav, styled by active state. */
function NavChip({ href, isActive, children }: { href: string; isActive: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold no-underline transition-colors",
        isActive
          ? "border-ui-brand bg-ui-card text-ui-fg"
          : "border-ui-border bg-ui-surface text-ui-muted hover:border-ui-brand hover:text-ui-fg",
      )}
    >
      {children}
    </a>
  );
}

/** Compact sticky letter jump nav shown above the grid on mobile (no sidebar there). */
export function MobileNav({
  groups,
  activeSection,
}: {
  groups: ReadonlyArray<ComponentGroup>;
  activeSection: string | null;
}) {
  return (
    <div className="sticky top-12 z-30 -mx-4 mb-10 flex flex-col gap-3 bg-ui-bg/75 px-4 py-3 backdrop-blur-[20px] lg:hidden">
      <nav className="flex flex-wrap gap-2" aria-label="Jump to">
        {groups.map((group) => (
          <NavChip key={group.id} href={`#${group.id}`} isActive={activeSection === group.id}>
            {group.label}
            <span className="tabular-nums opacity-60">{group.items.length}</span>
          </NavChip>
        ))}
      </nav>
    </div>
  );
}
