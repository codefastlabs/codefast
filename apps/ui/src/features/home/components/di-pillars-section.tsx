import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import { DecoratorsCard } from "#/features/home/components/decorators-card";
import { IntrospectionCard } from "#/features/home/components/introspection-card";
import { ScopesCard } from "#/features/home/components/scopes-card";
import { TypedTokensCard } from "#/features/home/components/typed-tokens-card";

interface DiPillarsSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The well-declared class for the typed-tokens card, as dual-theme highlighted HTML. */
  readonly rightListHtml: string;
  /** The mis-declared class for the typed-tokens card, as dual-theme highlighted HTML. */
  readonly wrongListHtml: string;
  /** Every decorator in one class for the decorators card, as dual-theme highlighted HTML. */
  readonly decoratorsHtml: string;
}

/** Why the flagship: four points from the package's README, each shown rather than told. */
export function DiPillarsSection({
  rightListHtml,
  wrongListHtml,
  decoratorsHtml,
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
          <TypedTokensCard rightListHtml={rightListHtml} wrongListHtml={wrongListHtml} className="reveal-up" />
          <DecoratorsCard decoratorsHtml={decoratorsHtml} className="reveal-up" />
          <ScopesCard className="reveal-up" />
          <IntrospectionCard className="reveal-up" />
        </div>
      </div>
    </section>
  );
}
