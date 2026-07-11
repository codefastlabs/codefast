import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { SectionHeader } from "#/components/shared/section-header";
import { MarqueeRow } from "#/features/home/components/marquee-row";
import { COMPONENT_COUNT, STATS } from "#/features/home/data";
import { COMPONENTS } from "#/registry/_core/components";

// Round-robin thirds keep the three marquee rows near-equal width and alphabet-mixed.
const MARQUEE_ROW_A = COMPONENTS.filter((_, index) => index % 3 === 0);
const MARQUEE_ROW_B = COMPONENTS.filter((_, index) => index % 3 === 1);
const MARQUEE_ROW_C = COMPONENTS.filter((_, index) => index % 3 === 2);

export function StatsSection() {
  return (
    <section aria-labelledby="home-stats-title" className="bg-ui-fg py-24 text-ui-inverse sm:py-32">
      <div className="container mx-auto px-4">
        <div className="reveal-up mb-16 grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p
                className="font-bold text-ui-inverse tabular-nums"
                style={{ fontSize: "clamp(44px,6vw,80px)", letterSpacing: "-0.04em" }}
              >
                {value}
              </p>
              <p className="mt-1 text-sm text-ui-inverse/70">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 border-t border-ui-inverse/15" />

        <div className="reveal-up mx-auto max-w-3xl text-center">
          <SectionHeader
            eyebrow="Library"
            inverted
            titleId="home-stats-title"
            title={`${COMPONENT_COUNT}+ components in the box`}
            description="Every primitive ships as a named sub-path import — browse live previews and copy-ready source."
            className="mx-auto mb-8 text-center"
          />
        </div>
      </div>

      {/* Full-bleed marquee — the edge fade masks the viewport edges, not the container's. */}
      <div className="reveal-up mb-8 space-y-3">
        <MarqueeRow components={MARQUEE_ROW_A} className="[--marquee-duration:80s]" />
        <MarqueeRow components={MARQUEE_ROW_B} reverse className="[--marquee-duration:66s]" />
        <MarqueeRow components={MARQUEE_ROW_C} className="[--marquee-duration:92s]" />
      </div>

      <div className="text-center">
        <Button
          asChild
          variant="outline"
          className="border-ui-inverse/20 bg-transparent text-ui-inverse hover:bg-ui-inverse/10 hover:text-ui-inverse dark:border-ui-inverse/20 dark:bg-transparent dark:hover:bg-ui-inverse/10"
        >
          <Link to="/components">View all components</Link>
        </Button>
      </div>
    </section>
  );
}
