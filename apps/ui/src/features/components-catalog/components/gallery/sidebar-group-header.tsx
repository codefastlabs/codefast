import { cn } from "@codefast/ui/lib/utils";

import type { ComponentGroup } from "#/features/components-catalog/data";

// Renders either an <a> (gallery jump link) or a <p> (static label) depending on
// `jumpToBand`, so the props are a plain named interface rather than an extension
// of a single host element's `ComponentProps`.
interface SidebarGroupHeaderProps {
  readonly group: ComponentGroup;
  readonly active: boolean;
  /** Gallery: render as an in-page jump link to the letter band. Detail: a static label. */
  readonly jumpToBand: boolean;
}

/** A letter-band header in the sidebar nav: a jump link in the gallery, a static label on detail pages. */
export function SidebarGroupHeader({ group, active, jumpToBand }: SidebarGroupHeaderProps) {
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
