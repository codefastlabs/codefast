import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { LocateFixedIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface SidebarComponentLinkProps extends ComponentProps<"div"> {
  readonly slug: string;
  readonly name: string;
  readonly active?: boolean;
  /** Gallery only — reveals a hover action that scrolls to the component's card in place. */
  readonly showScrollTo?: boolean;
}

/** A single component entry in the sidebar nav, with an optional scroll-to action. */
export function SidebarComponentLink({
  slug,
  name,
  active,
  showScrollTo,
  className,
  ...props
}: SidebarComponentLinkProps) {
  return (
    <div
      className={cn(
        "group/item flex items-center rounded-md",
        active ? "bg-ui-surface" : "hover:bg-ui-surface",
        className,
      )}
      {...props}
    >
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
