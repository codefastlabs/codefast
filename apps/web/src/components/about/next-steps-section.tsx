import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { SectionHeader } from "#/components/shared/section-header";

export function NextStepsSection() {
  return (
    <section
      aria-labelledby="about-next-steps-title"
      className="mt-16 rounded-2xl border border-ui-border/60 bg-ui-card p-8 text-center sm:p-10"
    >
      <SectionHeader
        eyebrow="Next steps"
        titleId="about-next-steps-title"
        title="Ready to explore?"
        description="Browse live previews with copy-ready source for every component, or open the repository to see how the design system is built."
        className="mx-auto mb-8 text-center"
      />

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/components">Open component gallery</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
