import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import type { Feature } from "#/features/home/data";

interface FeaturesSectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  readonly eyebrow: string;
  readonly titleId: string;
  readonly title: ReactNode;
  readonly description: string;
  readonly features: ReadonlyArray<Feature>;
}

/** A numbered list of the points a package makes, under a section header. */
export function FeaturesSection({
  eyebrow,
  titleId,
  title,
  description,
  features,
  className,
  ...props
}: FeaturesSectionProps) {
  return (
    <section aria-labelledby={titleId} className={cn("py-24 sm:py-32", className)} {...props}>
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow={eyebrow}
          titleId={titleId}
          title={title}
          description={description}
          className="reveal-up mb-16"
        />

        <div className="divide-y divide-ui-border/60">
          {features.map(({ number, title: featureTitle, description: featureDescription }) => (
            <article
              key={featureTitle}
              className="group reveal-up grid gap-4 py-10 sm:grid-cols-[56px_1fr_1.5fr] sm:gap-10"
            >
              <p className="font-mono text-sm text-ui-muted tabular-nums transition-colors duration-200 group-hover:text-ui-brand">
                {number}
              </p>
              <h3 className="text-base font-semibold text-ui-fg">{featureTitle}</h3>
              <p className="text-sm leading-relaxed text-ui-muted">{featureDescription}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
