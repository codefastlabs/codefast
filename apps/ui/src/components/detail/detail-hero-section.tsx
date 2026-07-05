import { Badge } from "@codefast/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@codefast/ui/breadcrumb";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, CodeIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DetailPageToolbar } from "#/components/detail/detail-page-toolbar";
import type { ComponentMeta } from "#/registry/components";
import { CATEGORIES } from "#/registry/components";

const GITHUB_SRC = "https://github.com/codefastlabs/codefast/tree/main/packages/ui/src/components";

const STATUS_BADGE: Record<"beta" | "deprecated", { label: string; className: string }> = {
  beta: { label: "Beta", className: "border-amber-500/40 text-amber-600 dark:text-amber-400" },
  deprecated: {
    label: "Deprecated",
    className: "border-rose-500/40 text-rose-600 dark:text-rose-400",
  },
};

interface DetailHeroSectionProps extends ComponentProps<"div"> {
  readonly component: ComponentMeta;
}

/** Component detail header: breadcrumb, page actions, and title. */
export function DetailHeroSection({ component, className, ...props }: DetailHeroSectionProps) {
  const { slug, name, category, description, status, composition } = component;
  const categoryLabel = CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
  const statusBadge = status && status !== "stable" ? STATUS_BADGE[status] : undefined;
  const isComposition = composition !== undefined;

  return (
    <div className={cn("mb-10 border-b border-ui-border/60 pb-8", className)} {...props}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/components">Components</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRightIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          {isComposition ? null : (
            <Button asChild size="sm" variant="outline">
              <a href={`${GITHUB_SRC}/${slug}.tsx`} target="_blank" rel="noreferrer">
                <CodeIcon data-icon="inline-start" />
                Source
              </a>
            </Button>
          )}
          <DetailPageToolbar component={component} />
        </div>
      </div>

      <header className="max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-ui-border/60 text-ui-muted capitalize">
            {categoryLabel}
          </Badge>
          {statusBadge ? (
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          ) : null}
        </div>
        <h1 className="mb-4 text-3xl leading-none font-bold tracking-tighter text-ui-fg sm:text-4xl">{name}</h1>
        <p className="text-base leading-relaxed text-ui-muted">{description}</p>
      </header>
    </div>
  );
}
