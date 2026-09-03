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
              What you see
              <br />
              is what ships.
            </>
          }
          description="Every tile is the real component, running in your browser — fire a toast, scrub the chart, drag the carousel, type into the field. No screenshots. No mockups."
          className="reveal-up mb-16"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_WALL.map(({ slug, wide }) => (
            <DemoTile key={slug} slug={slug} wide={wide} />
          ))}
        </div>

        <div className="reveal-up mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/ui/components">Explore all {COMPONENT_COUNT}+ components</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
