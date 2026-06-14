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
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, CodeIcon, PackageIcon } from "lucide-react";

import type { ComponentMeta } from "#/registry/components";
import { CATEGORIES, componentImportLabel } from "#/registry/components";

const GITHUB_SRC = "https://github.com/codefastlabs/codefast/tree/main/packages/ui/src/components";
const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

interface ComponentDetailHeaderProps {
  readonly component: ComponentMeta;
}

/**
 * The detail-page masthead: category breadcrumb, title and description, source /
 * npm links, and the install + import-path panel.
 */
const STATUS_BADGE: Record<"beta" | "deprecated", { label: string; className: string }> = {
  beta: { label: "Beta", className: "border-amber-500/40 text-amber-600 dark:text-amber-400" },
  deprecated: {
    label: "Deprecated",
    className: "border-rose-500/40 text-rose-600 dark:text-rose-400",
  },
};

export function ComponentDetailHeader({ component }: ComponentDetailHeaderProps) {
  const { slug, name, category, description, status, composition } = component;
  const categoryLabel = CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
  const statusBadge = status && status !== "stable" ? STATUS_BADGE[status] : undefined;
  const isComposition = composition !== undefined;

  return (
    <>
      <Breadcrumb className="mb-8">
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
            <BreadcrumbLink asChild>
              <Link to="/components" hash={category}>
                {categoryLabel}
              </Link>
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

      <header className="mb-10 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-ui-border text-ui-muted capitalize">
            {categoryLabel}
          </Badge>
          {statusBadge ? (
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          ) : null}
        </div>
        <h1 className="mb-4 text-4xl leading-none font-bold tracking-tighter text-ui-fg md:text-5xl">{name}</h1>
        <p className="mb-6 text-base leading-relaxed text-ui-muted">{description}</p>
        <div className="flex flex-wrap gap-2">
          {isComposition ? null : (
            <Button asChild size="sm" variant="outline">
              <a href={`${GITHUB_SRC}/${slug}.tsx`} target="_blank" rel="noreferrer">
                <CodeIcon data-icon="inline-start" />
                Source
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              <PackageIcon data-icon="inline-start" />
              npm
            </a>
          </Button>
        </div>
      </header>

      <div className="mb-12 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">Install</p>
          <div className="rounded-xl border border-ui-border bg-ui-surface px-4 py-2.5 font-mono text-sm text-ui-fg">
            pnpm add @codefast/ui
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">
            {isComposition ? "Composed from" : "Import path"}
          </p>
          <div className="truncate rounded-xl border border-ui-border bg-ui-surface px-4 py-2.5 font-mono text-sm text-ui-brand">
            {componentImportLabel(component)}
          </div>
        </div>
      </div>
    </>
  );
}
