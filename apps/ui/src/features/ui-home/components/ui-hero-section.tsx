import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { COMPONENT_COUNT } from "#/features/home/data";
import { UiHeroShowcase } from "#/features/ui-home/components/ui-hero-showcase";

/** The `/ui` landing hero — the library's own pitch, staged beside a collage of real components. */
export function UiHeroSection() {
  return (
    <section
      aria-labelledby="ui-hero-title"
      className="relative overflow-hidden border-b border-ui-border/60 px-4 py-20 sm:py-28 lg:py-32"
    >
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-0 origin-top bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklab,var(--color-sky-500)_12%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklab,var(--color-sky-400)_10%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--ui-fg)_12%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] [background-size:24px_24px]"
      />

      <div className="relative container mx-auto">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,24rem)]">
          <div className="text-center lg:text-start">
            <div className="hero-enter">
              <Badge variant="outline" className="mb-6 border-ui-border/60 text-ui-muted">
                React 19 · Radix UI · Tailwind v4
              </Badge>
            </div>

            <h1
              id="ui-hero-title"
              className="hero-enter mx-auto mb-5 max-w-4xl leading-none font-bold tracking-tighter text-ui-fg [--hero-enter-delay:100ms] lg:mx-0"
              style={{ fontSize: "clamp(44px,6vw,80px)" }}
            >
              Accessible components.
              <br />
              <span className="text-ui-brand">Yours to own.</span>
            </h1>

            <p className="hero-enter mx-auto mb-8 max-w-lg text-lg leading-relaxed text-ui-muted [--hero-enter-delay:200ms] lg:mx-0">
              {COMPONENT_COUNT}+ React components built on Radix UI primitives and styled with Tailwind CSS v4. Typed to
              the prop, themeable in plain CSS, and yours to copy — source and all.
            </p>

            <div className="hero-enter flex flex-col items-center gap-3 [--hero-enter-delay:300ms] sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link to="/ui/components">Browse components</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/ui/about">Get started</Link>
              </Button>
            </div>
          </div>

          <div className="hero-enter [--hero-enter-delay:150ms]">
            <UiHeroShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
