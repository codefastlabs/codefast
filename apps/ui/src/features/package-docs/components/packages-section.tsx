import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import { PackageCard } from "#/features/package-docs/components/package-card";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface PackagesSectionProps extends Omit<ComponentProps<"section">, "children"> {
  readonly packages: ReadonlyArray<PackageSummary>;
}

/** The landing page's package grid — every published `@codefast/*` package with a way into its docs. */
export function PackagesSection({ packages, ...props }: PackagesSectionProps) {
  return (
    <section
      id="packages"
      aria-labelledby="packages-title"
      className="scroll-mt-anchor border-t border-ui-border/60 py-24"
      {...props}
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Packages"
          titleId="packages-title"
          title="One repo, every layer."
          description="UI components, variant styling, appearance management, consent-gated tracking, dependency injection, and the tooling that keeps them honest — all published under @codefast."
          className="mb-12"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.slug} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}
