import { cn } from "@codefast/ui/lib/utils";
import { Skeleton } from "@codefast/ui/skeleton";
import type { ComponentProps } from "react";
import { Suspense, lazy } from "react";

import { SectionHeader } from "#components/shared/section-header";
import { DecoratorsCard } from "#features/home/components/decorators-card";
import { TypedTokensCard } from "#features/home/components/typed-tokens-card";
import type { FoldedSnippet } from "#features/home/lib/home-snippets";

// The two cards that run a container are split off so @codefast/di stays out of the home page's initial JS.
const ScopesCard = lazy(() =>
  import("#features/home/components/scopes-card").then((module) => ({ default: module.ScopesCard })),
);
const IntrospectionCard = lazy(() =>
  import("#features/home/components/introspection-card").then((module) => ({ default: module.IntrospectionCard })),
);

interface DiPillarsSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The well-declared class for the typed-tokens card, as dual-theme highlighted HTML. */
  readonly rightListHtml: string;
  /** The mis-declared class for the typed-tokens card, as dual-theme highlighted HTML. */
  readonly wrongListHtml: string;
  /** Every decorator in one class for the decorators card, its import block split off. */
  readonly decorators: FoldedSnippet;
}

/** Why `@codefast/di`: four points from the package's README, each shown rather than told. */
export function DiPillarsSection({
  rightListHtml,
  wrongListHtml,
  decorators,
  className,
  ...props
}: DiPillarsSectionProps) {
  return (
    <section
      aria-labelledby="home-pillars-title"
      className={cn("border-t border-ui-border/60 py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Why @codefast/di"
          titleId="home-pillars-title"
          title={
            <>
              Explicit by design,
              <br />
              checked by the compiler.
            </>
          }
          description="Every dependency is declared where it is consumed and checked where it is declared. The container does the construction; the compiler does the arguing."
          className="reveal-up mb-16"
        />
        {/* The tall decorators sample takes the right column for two rows, so the two toggling cards stack beside it. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
          <TypedTokensCard rightListHtml={rightListHtml} wrongListHtml={wrongListHtml} className="reveal-up" />
          <DecoratorsCard decorators={decorators} className="reveal-up md:col-start-2 md:row-span-2 md:row-start-1" />
          <Suspense fallback={<Skeleton aria-hidden className="min-h-[33rem] rounded-2xl" />}>
            <ScopesCard className="reveal-up" />
          </Suspense>
          <Suspense
            fallback={<Skeleton aria-hidden className="min-h-[40rem] rounded-2xl md:col-span-2 md:min-h-[19rem]" />}
          >
            <IntrospectionCard className="reveal-up md:col-span-2" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
