import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import { DecoratorsCard } from "#/features/home/components/decorators-card";
import { IntrospectionCard } from "#/features/home/components/introspection-card";
import { ScopesCard } from "#/features/home/components/scopes-card";
import { TypedTokensCard } from "#/features/home/components/typed-tokens-card";

interface DiPillarsSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The mis-declared class for the typed-tokens card, as dual-theme highlighted HTML. */
  readonly wrongListHtml: string;
  /** Every decorator in one class for the decorators card, as dual-theme highlighted HTML. */
  readonly decoratorsHtml: string;
}

/** Why the flagship: four points from the package's README, each shown rather than told. */
export function DiPillarsSection({ wrongListHtml, decoratorsHtml, ...props }: DiPillarsSectionProps) {
  return (
    <section aria-labelledby="home-pillars-title" className="border-t border-ui-border/60 py-24 sm:py-32" {...props}>
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
          className="reveal-up mb-12"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TypedTokensCard wrongListHtml={wrongListHtml} className="reveal-up" />
          <DecoratorsCard decoratorsHtml={decoratorsHtml} className="reveal-up" />
          <ScopesCard className="reveal-up" />
          <IntrospectionCard className="reveal-up" />
        </div>
      </div>
    </section>
  );
}
