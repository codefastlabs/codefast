/**
 * Per-slug body of the detail page. The route loader awaits `fetchDetail` and
 * ships the serializable detail as loader data, so the body renders synchronously
 * (the loader, not `React.lazy`, gates render — no full-page skeleton). Live
 * preview components can't cross the serialization boundary, so they're resolved
 * client-side from `EXAMPLE_COMPONENT_BY_REF`.
 */
import { AccessibilitySection } from "#/components/detail/accessibility-section";
import { AnatomySection } from "#/components/detail/anatomy-section";
import { ApiSection } from "#/components/detail/api-section";
import { ComponentPager } from "#/components/detail/component-pager";
import { DetailMobileToc } from "#/components/detail/detail-mobile-toc";
import { ExamplesSection } from "#/components/detail/examples-section";
import { FeaturesSection } from "#/components/detail/features-section";
import { GuidelinesSection } from "#/components/detail/guidelines-section";
import { OnThisPage } from "#/components/detail/on-this-page";
import { RelatedSection } from "#/components/detail/related-section";
import type { TocItem } from "#/components/detail/toc";
import { UsageSection } from "#/components/detail/usage-section";
import type { ComponentMeta } from "#/registry/_core/components";
import { NEIGHBORS_BY_SLUG } from "#/registry/_core/components";
import { DEMO_BY_SLUG } from "#/registry/_core/demos";
import { loadDoc } from "#/registry/_core/docs";
import { docDemo } from "#/registry/_core/source";
import type { ResolvedComponentDoc, ResolvedDocExample } from "#/registry/_core/types";

export interface ComponentDetail {
  readonly component: ComponentMeta;
  /** The rich doc, when one exists. */
  readonly doc?: ResolvedComponentDoc | undefined;
  /** Curated doc examples, or a single example synthesised from the card demo. */
  readonly examples: ReadonlyArray<ResolvedDocExample>;
}

/**
 * The examples shown on a detail page: the curated list from the rich docs
 * registry, or a single example synthesised from the card demo as a fallback.
 */
async function loadDetail(component: ComponentMeta): Promise<ComponentDetail> {
  const doc = await loadDoc(component.slug);

  if (doc) {
    return { component, doc, examples: doc.examples };
  }

  const demo = DEMO_BY_SLUG.get(component.slug);

  if (demo) {
    const source = await demo.loadSource();

    return { component, examples: [{ id: "example", title: "Example", source: docDemo(component.slug), ...source }] };
  }

  return { component, examples: [] };
}

const detailCache = new Map<string, Promise<ComponentDetail>>();

/** Memoised `loadDetail` so an intent preload and the route loader share one fetch. */
export function fetchDetail(component: ComponentMeta): Promise<ComponentDetail> {
  const cached = detailCache.get(component.slug);

  if (cached) {
    return cached;
  }

  const promise = loadDetail(component);

  // A failed load (e.g. a network blip) must not poison the cache — drop it so
  // the next render retries instead of replaying the rejection forever.
  promise.catch(() => detailCache.delete(component.slug));
  detailCache.set(component.slug, promise);

  return promise;
}

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
          <div className="sticky top-toc rounded-xl bg-ui-bg/75 p-3 backdrop-blur-lg backdrop-saturate-150">
            <OnThisPage items={toc} />
          </div>
        </aside>
      </div>
    </>
  );
}
