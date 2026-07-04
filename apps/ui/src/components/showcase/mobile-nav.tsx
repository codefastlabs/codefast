import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useRef } from "react";

import { NavChip } from "#/components/showcase/nav-chip";
import type { ComponentGroup } from "#/data/showcase";
import { useScrollChipIntoView } from "#/hooks/use-scroll-chip-into-view";

interface MobileNavProps extends ComponentProps<"div"> {
  readonly groups: ReadonlyArray<ComponentGroup>;
  readonly activeSection: string | null;
}

/** Compact sticky letter jump nav shown above the grid on mobile (no sidebar there). */
export function MobileNav({ groups, activeSection, className, ...props }: MobileNavProps) {
  const navRef = useRef<HTMLElement>(null);

  useScrollChipIntoView(navRef, activeSection);

  return (
    <div
      className={cn(
        "sticky top-header z-30 -mx-4 mb-10 border-b border-ui-border/60 bg-ui-bg/75 px-4 py-3 backdrop-blur-lg backdrop-saturate-150 lg:hidden",
        className,
      )}
      {...props}
    >
      <nav
        ref={navRef}
        className="flex scrollbar-none gap-2 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Jump to"
      >
        {groups.map((group) => (
          <NavChip key={group.id} href={`#${group.id}`} isActive={activeSection === group.id} chipId={group.id}>
            {group.label}
            <span className="tabular-nums opacity-60">{group.items.length}</span>
          </NavChip>
        ))}
      </nav>
    </div>
  );
}
