import { Link } from "@tanstack/react-router";

import { DocSection } from "#/components/detail/doc-section";
import { COMPONENT_BY_SLUG } from "#/registry/components";

interface RelatedSectionProps {
  /** Third-party packages the component is built on. */
  readonly dependencies?: ReadonlyArray<string> | undefined;
  /** Slugs of related components, rendered as links. */
  readonly related?: ReadonlyArray<string> | undefined;
}

/** The "Related" section: build-on dependencies plus related component links. */
export function RelatedSection({ dependencies, related }: RelatedSectionProps) {
  return (
    <DocSection id="related" title="Related">
      {dependencies?.length ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">Built on</p>
          <div className="flex flex-wrap gap-2">
            {dependencies.map((dep) => (
              <span
                key={dep}
                className="rounded-full border border-ui-border bg-ui-surface px-3 py-1 font-mono text-xs text-ui-muted"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {related?.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">Related components</p>
          <div className="flex flex-wrap gap-2">
            {related.map((relatedSlug) => {
              const target = COMPONENT_BY_SLUG.get(relatedSlug);

              if (!target) {
                return null;
              }

              return (
                <Link
                  key={relatedSlug}
                  to="/components/$slug"
                  params={{ slug: relatedSlug }}
                  className="rounded-full border border-ui-border bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted no-underline transition-colors hover:border-ui-brand hover:text-ui-fg"
                >
                  {target.name}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </DocSection>
  );
}
