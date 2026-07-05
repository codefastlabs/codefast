import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { CopyPageMenu } from "#/components/detail/copy-page-menu";
import type { ComponentMeta } from "#/registry/_core/components";
import { NEIGHBORS_BY_SLUG } from "#/registry/_core/components";

interface DetailPageToolbarProps extends Omit<ComponentProps<"div">, "children"> {
  readonly component: ComponentMeta;
}

/** Page-level actions for the detail header: copy-as-Markdown and prev/next navigation. */
export function DetailPageToolbar({ component, className, ...props }: DetailPageToolbarProps) {
  const neighbors = NEIGHBORS_BY_SLUG.get(component.slug);
  const { previous, next } = neighbors ?? {};

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <CopyPageMenu component={component} />
      {previous ? (
        <Button asChild variant="outline" size="icon-sm" aria-label={`Previous: ${previous.name}`}>
          <Link to="/components/$slug" params={{ slug: previous.slug }}>
            <ArrowLeftIcon />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="No previous component">
          <ArrowLeftIcon />
        </Button>
      )}
      {next ? (
        <Button asChild variant="outline" size="icon-sm" aria-label={`Next: ${next.name}`}>
          <Link to="/components/$slug" params={{ slug: next.slug }}>
            <ArrowRightIcon />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="No next component">
          <ArrowRightIcon />
        </Button>
      )}
    </div>
  );
}
