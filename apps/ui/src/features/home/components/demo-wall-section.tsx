import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { SectionHeader } from "#/components/shared/section-header";
import { DemoTile } from "#/features/home/components/demo-tile";
import { COMPONENT_COUNT, DEMO_WALL } from "#/features/home/data";

/** Home playground: a bento grid of live, interactive registry demos. */
export function DemoWallSection() {
  return (
    <section aria-labelledby="home-playground-title" className="border-t border-ui-border/60 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Playground"
          titleId="home-playground-title"
          title={
            <>
              Don&apos;t read about it.
              <br />
              Play with it.
            </>
          }
          description="Every tile below is the real component, running live — fire a toast, drag the carousel, type in the code. What you see is exactly what ships."
          className="reveal-up mb-16"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_WALL.map(({ slug, wide }) => (
            <DemoTile key={slug} slug={slug} wide={wide} />
          ))}
        </div>

        <div className="reveal-up mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/components">Explore all {COMPONENT_COUNT}+ components</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
