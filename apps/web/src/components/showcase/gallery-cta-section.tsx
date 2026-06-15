import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { CopySnippet } from "#/components/shared/copy-snippet";
import { SectionHeader } from "#/components/shared/section-header";
import { INSTALL_COMMAND } from "#/lib/install";

export function GalleryCtaSection() {
  return (
    <section
      aria-labelledby="gallery-cta-title"
      className="mt-16 rounded-2xl border border-ui-border/60 bg-ui-surface p-8 text-center sm:p-10"
    >
      <SectionHeader
        eyebrow="Explore further"
        titleId="gallery-cta-title"
        title="Ready to build?"
        description="Install the package, wire up the CSS, and start composing — or return home to see what codefast/ui offers."
        className="mx-auto mb-8 text-center"
      />

      <CopySnippet code={INSTALL_COMMAND} className="mx-auto mb-8 max-w-md text-start" />

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/about">Getting Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
