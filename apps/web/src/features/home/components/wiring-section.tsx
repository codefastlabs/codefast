import { Skeleton } from "@codefast/ui/skeleton";
import { Suspense, lazy } from "react";

import { SectionHeader } from "#components/shared/section-header";

// Split off so @codefast/di stays out of the home page's initial JS; the prerendered markup still carries the demo.
const ContainerPlayground = lazy(() =>
  import("#features/home/components/container-playground").then((module) => ({ default: module.ContainerPlayground })),
);

/** The live section: a real container in the browser, its graph, its scopes, and what it builds. */
export function WiringSection() {
  return (
    <section aria-labelledby="home-wiring-title" className="border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Live"
          titleId="home-wiring-title"
          title={
            <>
              Every arrow
              <br />
              is real.
            </>
          }
          description="The quick start's OrderService, grown into a shop and running in your browser. The graph comes from generateDependencyGraph(), the badges from each binding's scope, and the log from the instances the container actually built. Open a request scope, resolve, resolve again, and watch what it reuses."
          className="reveal-up mb-16"
        />
        <Suspense fallback={<Skeleton aria-hidden className="min-h-[53rem] rounded-2xl lg:min-h-[30rem]" />}>
          <ContainerPlayground />
        </Suspense>
      </div>
    </section>
  );
}
