import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { COMPONENT_COUNT } from "#/features/home/data";

/** The `/ui` landing hero — the library's own pitch, with the gallery and Getting Started as its calls to action. */
export function UiHeroSection() {
  return (
    <section
      aria-labelledby="ui-hero-title"
      className="relative overflow-hidden border-b border-ui-border/60 px-4 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklab,var(--color-sky-500)_12%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklab,var(--color-sky-400)_10%,transparent),transparent)]"
      />
      <div className="relative container mx-auto text-center">
        <Badge variant="outline" className="mb-6 border-ui-border/60 text-ui-muted">
          React 19 · Radix UI · Tailwind v4
        </Badge>
        <h1
          id="ui-hero-title"
          className="mx-auto mb-5 max-w-4xl leading-none font-bold tracking-tighter text-ui-fg"
          style={{ fontSize: "clamp(44px,6vw,80px)" }}
        >
          Beautiful components
          <br />
          <span className="text-ui-brand">for React 19.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-ui-muted">
          {COMPONENT_COUNT}+ accessible components built on Radix UI and Tailwind CSS v4. Copy the source. Own the code.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/ui/components">Browse components</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/ui/about">Get started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
