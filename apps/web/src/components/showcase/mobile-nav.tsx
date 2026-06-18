import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { CommandPaletteHint } from "#/components/showcase/command-palette-hint";
import type { ComponentGroup } from "#/data/showcase";

/** A pill link used in the mobile jump nav, styled by active state. */
function NavChip({
  href,
  isActive,
  chipId,
  children,
}: {
  href: string;
  isActive: boolean;
  chipId: string;
  children: ReactNode;
}) {
  return (
    <a
      data-chip-id={chipId}
      href={href}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap no-underline transition-colors duration-200",
        isActive
          ? "border-ui-brand bg-ui-card text-ui-fg"
          : "border-ui-border/60 bg-ui-surface text-ui-muted hover:border-ui-brand hover:text-ui-fg",
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
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activeSection || !navRef.current) {
      return;
    }

    const activeChip = navRef.current.querySelector<HTMLElement>(`[data-chip-id="${activeSection}"]`);

    activeChip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeSection]);

  return (
    <div className="sticky top-header z-30 -mx-4 mb-10 flex flex-col gap-2 border-b border-ui-border/60 bg-ui-bg/75 px-4 py-3 backdrop-blur-lg backdrop-saturate-150 lg:hidden">
      <nav
        ref={navRef}
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Jump to"
      >
        {groups.map((group) => (
          <NavChip key={group.id} href={`#${group.id}`} isActive={activeSection === group.id} chipId={group.id}>
            {group.label}
            <span className="tabular-nums opacity-60">{group.items.length}</span>
          </NavChip>
        ))}
      </nav>
      <CommandPaletteHint className="text-xs text-ui-muted" />
    </div>
  );
}
