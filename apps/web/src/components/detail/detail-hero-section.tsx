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

import { DetailInstallPanel } from "#/components/detail/detail-install-panel";
import type { ComponentMeta } from "#/registry/components";
import { CATEGORIES } from "#/registry/components";

const GITHUB_SRC = "https://github.com/codefastlabs/codefast/tree/main/packages/ui/src/components";
const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

const STATUS_BADGE: Record<"beta" | "deprecated", { label: string; className: string }> = {
  beta: { label: "Beta", className: "border-amber-500/40 text-amber-600 dark:text-amber-400" },
  deprecated: {
    label: "Deprecated",
    className: "border-rose-500/40 text-rose-600 dark:text-rose-400",
  },
};

interface DetailHeroSectionProps {
  readonly component: ComponentMeta;
}

/** Gradient masthead: breadcrumb, title, actions, and install panel. */
export function DetailHeroSection({ component }: DetailHeroSectionProps) {
  const { slug, name, category, description, status, composition } = component;
  const categoryLabel = CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
  const statusBadge = status && status !== "stable" ? STATUS_BADGE[status] : undefined;
  const isComposition = composition !== undefined;

  return (
    <div className="relative border-b border-ui-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-500)_8%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-400)_6%,transparent),transparent)]"
      />
      <div className="relative container mx-auto px-4 pt-10 pb-8">
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
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-8 max-w-2xl">
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

        <DetailInstallPanel component={component} />
      </div>
    </div>
  );
}
