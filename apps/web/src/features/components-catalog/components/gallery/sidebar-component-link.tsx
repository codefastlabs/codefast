import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { LocateFixedIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { NewBadge } from "#/components/shared/new-badge";
import { track } from "#/features/tracking/lib/tracking";
import { CURRENT_PAGE_ONLY } from "#/lib/nav-links";

interface SidebarComponentLinkProps extends ComponentProps<"div"> {
  readonly slug: string;
  readonly name: string;
  /** Gallery only — reveals a hover action that scrolls to the component's card in place. */
  readonly showScrollTo?: boolean;
  /** Flags a recently added component with a "New" badge. */
  readonly isNew?: boolean | undefined;
  /** Which nav surface owns this link — tracked as `select_component.surface`. */
  readonly surface: "gallery-sidebar" | "detail-sidebar";
}

/** A single component entry in the sidebar nav, with an optional scroll-to action. */
export function SidebarComponentLink({
  slug,
  name,
  showScrollTo,
  isNew,
  surface,
  className,
  ...props
}: SidebarComponentLinkProps) {
  return (
    // The row tints from the link's own current state, so no prop can disagree with its `aria-current`.
    <div
      className={cn(
        "group/item flex items-center rounded-md hover:bg-ui-surface has-[[aria-current=page]]:bg-ui-surface",
        className,
      )}
      {...props}
    >
      <Link
        to="/ui/components/$slug"
        params={{ slug }}
        data-slug={slug}
        activeOptions={CURRENT_PAGE_ONLY}
        className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs no-underline"
        activeProps={{ className: "font-medium text-ui-fg" }}
        inactiveProps={{ className: "text-ui-muted group-hover/item:text-ui-fg" }}
        onClick={() => {
          track("select_component", { slug, surface });
        }}
      >
        {name}
      </Link>
      {isNew ? <NewBadge className="me-1" /> : null}
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
