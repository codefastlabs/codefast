import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { SectionHeader } from "#/components/shared/section-header";

export function DetailCtaSection() {
  return (
    <section
      aria-labelledby="detail-cta-title"
      className="mt-16 rounded-2xl border border-ui-border/60 bg-ui-surface p-8 text-center sm:p-10"
    >
      <SectionHeader
        eyebrow="Explore further"
        titleId="detail-cta-title"
        title="Ready to integrate?"
        description="Follow the Getting Started guide to install @codefast/ui, or browse the full component gallery."
        className="mx-auto mb-8 text-center"
      />

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/about">Getting Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/components">Browse all components</Link>
        </Button>
      </div>
    </section>
  );
}
