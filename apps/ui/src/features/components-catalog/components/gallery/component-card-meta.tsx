import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { NewBadge } from "#/components/shared/new-badge";
import { track } from "#/features/tracking/lib/tracking";

interface ComponentCardMetaProps extends ComponentProps<"div"> {
  readonly name: string;
  readonly description: string;
  /** When set, the title links to the component's detail page; the router warms its chunk on hover/focus. */
  readonly slug?: string | undefined;
  /** Flags a recently added component with a "New" badge next to the title. */
  readonly isNew?: boolean | undefined;
}

/** Gallery card footer: the component name (links to detail when `slug` is set) and its description. */
export function ComponentCardMeta({ name, description, slug, isNew, className, ...props }: ComponentCardMetaProps) {
  return (
    <div className={cn("px-4 py-3", className)} {...props}>
      <div className="flex items-center gap-2">
        {slug ? (
          <Link
            to="/components/$slug"
            params={{ slug }}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-ui-fg no-underline"
            onClick={() => {
              track("select_component", { slug, surface: "gallery-card" });
            }}
          >
            {name}
            <ArrowUpRightIcon className="size-3.5 text-ui-muted transition-colors duration-200 group-hover:text-ui-brand" />
          </Link>
        ) : (
          <p className="text-sm font-semibold text-ui-fg">{name}</p>
        )}
        {isNew ? <NewBadge /> : null}
      </div>
      <p className="mt-0.5 line-clamp-2 min-h-10 text-xs leading-5 text-ui-muted">{description}</p>
    </div>
  );
}
