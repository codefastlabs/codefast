import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { PageHeader } from "#/components/shared/page-header";
import { ALPHABET_GROUPS, GALLERY_STATS } from "#/data/showcase";
import { COMPONENTS } from "#/registry/components";

const firstLetterGroupId = ALPHABET_GROUPS[0]?.id ?? "letter-A";

export function GalleryHeroSection() {
  return (
    <div className="relative border-b border-ui-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-500)_8%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-400)_6%,transparent),transparent)]"
      />
      <div className="relative container mx-auto page-enter px-4 pt-16 pb-10">
        <PageHeader
          eyebrow={
            <Badge variant="outline" className="border-ui-border/60 text-ui-muted">
              Components
            </Badge>
          }
          title={
            <>
              {COMPONENTS.length}+ ready-to-use <span className="text-ui-brand">components.</span>
            </>
          }
          description="Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named sub-path import — no barrel files, no tree-shaking surprises, no config required."
        />

        <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 sm:max-w-xl">
          {GALLERY_STATS.map(({ value, label }) => (
            <div key={label}>
              <dt className="text-xs text-ui-muted">{label}</dt>
              <dd className="text-2xl font-bold tracking-tight text-ui-fg tabular-nums sm:text-3xl">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/about">Getting Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={`#${firstLetterGroupId}`}>Jump to {ALPHABET_GROUPS[0]?.label ?? "A"}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
