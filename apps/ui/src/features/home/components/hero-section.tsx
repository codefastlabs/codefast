import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { HeroDiCard } from "#/features/home/components/hero-di-card";
import { COMPONENT_COUNT } from "#/features/home/data";

interface HeroSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The flagship's quick start as dual-theme highlighted HTML, from the route loader. */
  readonly snippetHtml: string;
}

/** The landing hero: the portal's pitch beside the flagship's quick start. */
export function HeroSection({ snippetHtml, className, ...props }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="home-hero-title"
      className={cn(
        "relative flex min-h-[calc(100vh-var(--spacing-header))] items-center overflow-hidden px-4 py-20 sm:py-24",
        className,
      )}
      {...props}
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
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
          <div className="text-center lg:text-start">
            <div className="hero-enter">
              <Badge variant="outline" className="mb-6 border-ui-border/60 text-ui-muted">
                Codefast Labs · open source · TypeScript
              </Badge>
            </div>

            <h1
              id="home-hero-title"
              className="hero-enter mx-auto mb-5 max-w-4xl leading-none font-bold tracking-tighter text-ui-fg [--hero-enter-delay:100ms] lg:mx-0"
              style={{ fontSize: "clamp(48px,7vw,88px)" }}
            >
              Packages built
              <br />
              <span className="text-ui-brand">for React 19.</span>
            </h1>

            <p className="hero-enter mx-auto mb-8 max-w-lg text-lg leading-relaxed text-ui-muted [--hero-enter-delay:200ms] lg:mx-0">
              Dependency injection with typed tokens and an auto-mocking test bed, {COMPONENT_COUNT}+ accessible UI
              components, variant styling, theming, and consent-gated tracking — typed, documented, and published under
              @codefast.
            </p>

            <div className="hero-enter flex flex-col items-center gap-3 [--hero-enter-delay:300ms] sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link to="/" hash="packages">
                  Browse packages
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/docs/$pkg" params={{ pkg: "di" }}>
                  Explore @codefast/di
                </Link>
              </Button>
            </div>
          </div>

          <div className="hero-enter mx-auto w-full max-w-xl [--hero-enter-delay:200ms] lg:mx-0 lg:max-w-none">
            <HeroDiCard highlightedCode={snippetHtml} />
          </div>
        </div>
      </div>
    </section>
  );
}
