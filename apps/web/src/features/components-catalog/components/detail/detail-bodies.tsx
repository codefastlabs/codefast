/**
 * Per-slug body of the detail page. The route loader awaits `fetchDetail` (in `lib/detail.ts`, kept
 * apart from this UI so the route's critical chunk stays small) and ships the serializable detail as
 * loader data, so the body renders synchronously — the loader, not `React.lazy`, gates render. Live
 * preview components can't cross the serialization boundary, so they're resolved client-side from
 * `EXAMPLE_COMPONENT_BY_REF`.
 */
import { AccessibilitySection } from "#/features/components-catalog/components/detail/accessibility-section";
import { AnatomySection } from "#/features/components-catalog/components/detail/anatomy-section";
import { ApiSection } from "#/features/components-catalog/components/detail/api-section";
import { ComponentPager } from "#/features/components-catalog/components/detail/component-pager";
import { DetailMobileToc } from "#/features/components-catalog/components/detail/detail-mobile-toc";
import { ExamplesSection } from "#/features/components-catalog/components/detail/examples-section";
import { FeaturesSection } from "#/features/components-catalog/components/detail/features-section";
import { GuidelinesSection } from "#/features/components-catalog/components/detail/guidelines-section";
import { OnThisPage } from "#/features/components-catalog/components/detail/on-this-page";
import { RelatedSection } from "#/features/components-catalog/components/detail/related-section";
import type { TocItem } from "#/features/components-catalog/components/detail/toc";
import { UsageSection } from "#/features/components-catalog/components/detail/usage-section";
import type { ComponentDetail } from "#/features/components-catalog/lib/detail";
import { NEIGHBORS_BY_SLUG } from "#/registry/_core/components";

/** Builds the "On this page" entries from whichever sections are present. */
function buildToc({ doc, examples }: ComponentDetail): Array<TocItem> {
  const toc: Array<TocItem> = [];

  if (examples.length > 0) {
    toc.push({ id: "examples", label: "Examples", depth: 1 });

    if (examples.length > 1) {
      for (const example of examples) {
        toc.push({ id: example.id, label: example.title, depth: 2 });
      }
    }
  }
  if (doc?.usage) {
    toc.push({ id: "usage", label: "Usage", depth: 1 });
  }
  if (doc?.anatomy?.length) {
    toc.push({ id: "anatomy", label: "Anatomy", depth: 1 });
  }
  if (doc?.features?.length) {
    toc.push({ id: "features", label: "Features", depth: 1 });
  }
  if (doc?.api?.length) {
    toc.push({ id: "api", label: "API reference", depth: 1 });
  }
  if (doc?.accessibility) {
    toc.push({ id: "accessibility", label: "Accessibility", depth: 1 });
  }
  if (doc?.guidelines) {
    toc.push({ id: "guidelines", label: "Guidelines", depth: 1 });
  }
  if (doc?.related?.length || doc?.dependencies?.length) {
    toc.push({ id: "related", label: "Related", depth: 1 });
  }

  return toc;
}

interface DetailBodyProps {
  readonly detail: ComponentDetail;
}

export function DetailBody({ detail }: DetailBodyProps) {
  const { component, doc, examples } = detail;
  const neighbors = NEIGHBORS_BY_SLUG.get(component.slug);
  const hasRelated = (doc?.related?.length ?? 0) > 0 || (doc?.dependencies?.length ?? 0) > 0;
  const toc = buildToc(detail);

  return (
    <>
      <DetailMobileToc items={toc} className="sticky top-header z-30 -mx-4 mb-8 border-b border-ui-border/60" />

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_180px] xl:gap-12">
        <div className="min-w-0 space-y-16">
          {examples.length > 0 ? (
            <ExamplesSection examples={examples} showHint={!doc} />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-ui-border/60 bg-ui-surface p-10">
              <p className="max-w-sm text-center text-sm text-ui-muted">
                This component is best explored in your own app. See the source on GitHub for usage.
              </p>
            </div>
          )}

          {doc?.usage ? (
            <UsageSection code={doc.usage.code} highlightedCode={doc.usage.html} analyticsName={component.slug} />
          ) : null}

          {doc?.anatomy?.length ? <AnatomySection nodes={doc.anatomy} /> : null}

          {doc?.features?.length ? <FeaturesSection items={doc.features} /> : null}

          {doc?.api?.length ? <ApiSection groups={doc.api} /> : null}

          {doc?.accessibility ? (
            <AccessibilitySection keyboard={doc.accessibility.keyboard} notes={doc.accessibility.notes} />
          ) : null}

          {doc?.guidelines ? <GuidelinesSection do={doc.guidelines.do} dont={doc.guidelines.dont} /> : null}

          {hasRelated ? <RelatedSection dependencies={doc?.dependencies} related={doc?.related} /> : null}

          <ComponentPager
            previous={neighbors?.previous}
            next={neighbors?.next}
            className="border-t border-ui-border/60 pt-8"
          />
        </div>

        <aside className="hidden xl:block">
          <OnThisPage items={toc} />
        </aside>
      </div>
    </>
  );
}
