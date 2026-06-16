import { Badge } from "@codefast/ui/badge";

import { PageHeader } from "#/components/shared/page-header";

/** Getting Started page hero — eyebrow badge, title, and intro copy. */
export function AboutHeroSection() {
  return (
    <div className="relative border-b border-ui-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-500)_8%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklab,var(--color-sky-400)_6%,transparent),transparent)]"
      />
      <div className="relative container mx-auto px-4 pt-16 pb-12">
        <PageHeader
          className="page-enter"
          eyebrow={
            <Badge variant="outline" className="border-ui-border/60 text-ui-muted">
              Getting Started
            </Badge>
          }
          title={
            <>
              Up and running <span className="text-ui-brand">in minutes.</span>
            </>
          }
          description="@codefast/ui is a collection of copy-friendly React components. Install the package, wire up the CSS, and start building — no config files required."
        />
      </div>
    </div>
  );
}
