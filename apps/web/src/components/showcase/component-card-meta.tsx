import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";

import { usePreloadDetail } from "#/hooks/use-preload-detail";

/** Centered preview pane shared by the live-demo and docs-only gallery cards. */
export const PREVIEW_PANE_CLASS = "flex min-h-40 flex-1 items-start justify-center bg-ui-surface p-6";

interface ComponentCardMetaProps {
  readonly name: string;
  readonly description: string;
  /** When set, the title links to the component's detail page and warms its chunk on hover. */
  readonly slug?: string | undefined;
}

/** Gallery card footer: the component name (links to detail when `slug` is set) and its description. */
export function ComponentCardMeta({ name, description, slug }: ComponentCardMetaProps) {
  const preload = usePreloadDetail(slug);

  return (
    <div className="border-t border-ui-border/60 px-4 py-3">
      {slug ? (
        <Link
          to="/components/$slug"
          params={{ slug }}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-ui-fg no-underline"
          {...preload}
        >
          {name}
          <ArrowUpRightIcon className="size-3.5 text-ui-muted transition-colors duration-200 group-hover:text-ui-brand" />
        </Link>
      ) : (
        <p className="text-sm font-semibold text-ui-fg">{name}</p>
      )}
      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ui-muted">{description}</p>
    </div>
  );
}
