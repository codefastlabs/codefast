import { SectionHeader } from "#/components/shared/section-header";
import { ContainerPlayground } from "#/features/home/components/container-playground";

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
          description="This container runs in your browser. The graph comes from generateDependencyGraph(), the badges from each binding's scope, and the log from the instances the container actually built. Open a request scope, resolve, resolve again, and watch what it reuses."
          className="reveal-up mb-12"
        />
        <ContainerPlayground />
      </div>
    </section>
  );
}
