import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { COMPONENT_COUNT } from "#/components/about/about-data";
import { SectionHeader } from "#/components/shared/section-header";
import { COMPONENTS } from "#/registry/components";

export function LibrarySection() {
  return (
    <section
      aria-labelledby="about-library-title"
      className="rounded-2xl border border-ui-border/60 bg-ui-surface p-8 sm:p-10"
    >
      <SectionHeader
        eyebrow="Library"
        titleId="about-library-title"
        title={`${COMPONENT_COUNT}+ components available`}
        description="From primitives like Button and Badge to complex patterns like Command, Calendar, and Sidebar — everything follows the same composable API."
        className="mb-8"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {COMPONENTS.map(({ slug, name }) => (
          <Link
            key={slug}
            to="/components/$slug"
            params={{ slug }}
            className="rounded-full border border-ui-border/60 bg-ui-card px-3 py-1 text-xs text-ui-muted no-underline transition-colors duration-200 hover:border-ui-brand/40 hover:text-ui-fg"
          >
            {name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/components">Browse components</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://www.npmjs.com/package/@codefast/ui" target="_blank" rel="noreferrer">
            View on npm
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://github.com/codefastlabs/codefast" target="_blank" rel="noreferrer">
            View source
          </a>
        </Button>
      </div>
    </section>
  );
}
