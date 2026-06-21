/**
 * Per-slug, code-split body of the component detail page.
 *
 * `DETAIL_BODY_BY_SLUG` maps every component slug to a `React.lazy` component that —
 * on first render — loads ONLY that component's doc chunk (examples, sources
 * pre-highlighted at build time) and renders the full page body. Streaming SSR
 * awaits the chunk and ships complete HTML; on the client, navigating to
 * `/components/button` downloads button's chunk and nothing else.
 */
import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

import { AccessibilitySection } from "#/components/detail/accessibility-section";
import { AnatomySection } from "#/components/detail/anatomy-section";
import { ApiSection } from "#/components/detail/api-section";
import { ComponentPager } from "#/components/detail/component-pager";
import { DetailMobileToc } from "#/components/detail/detail-mobile-toc";
import { ExamplesSection } from "#/components/detail/examples-section";
import { GuidelinesSection } from "#/components/detail/guidelines-section";
import { OnThisPage } from "#/components/detail/on-this-page";
import { RelatedSection } from "#/components/detail/related-section";
import type { TocItem } from "#/components/detail/toc";
import type { ComponentMeta } from "#/registry/components";
import { COMPONENTS, COMPONENT_BY_SLUG, NEIGHBORS_BY_SLUG } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";
import { loadDoc } from "#/registry/docs";
import type { ResolvedComponentDoc, ResolvedDocExample } from "#/registry/types";

interface ComponentDetail {
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
    const [Demo, source] = await Promise.all([demo.load(), demo.loadSource()]);

    return { component, examples: [{ id: "example", title: "Example", Demo, ...source }] };
  }

  return { component, examples: [] };
}

const detailCache = new Map<string, Promise<ComponentDetail>>();

/** Memoised `loadDetail` so an intent preload and the lazy body share one fetch. */
function fetchDetail(component: ComponentMeta): Promise<ComponentDetail> {
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

/**
 * Warms a slug's detail chunk ahead of navigation. The `$slug` route loader
 * calls this, so the router's `defaultPreload: "intent"` turns every hover or
 * focus on a detail link into a background fetch — by the time the visitor
 * clicks, the body usually renders without its skeleton.
 */
export function preloadDetail(slug: string): void {
  const component = COMPONENT_BY_SLUG.get(slug);

  if (component) {
    fetchDetail(component).catch(() => {
      // Swallow: preloading is best-effort; rendering will retry and surface errors.
    });
  }
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
  if (doc?.anatomy) {
    toc.push({ id: "anatomy", label: "Anatomy", depth: 1 });
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

function DetailBody({ detail }: { detail: ComponentDetail }) {
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

          {doc?.anatomy ? (
            <AnatomySection
              code={doc.anatomy.code}
              highlightedCodeDark={doc.anatomy.htmlDark}
              highlightedCodeLight={doc.anatomy.htmlLight}
            />
          ) : null}

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

/**
 * One lazy body per component. Created once at module scope so `React.lazy`'s
 * internal cache survives re-renders and route remounts.
 */
export const DETAIL_BODY_BY_SLUG: ReadonlyMap<string, LazyExoticComponent<ComponentType>> = new Map(
  COMPONENTS.map((component) => [
    component.slug,
    lazy(async () => {
      const detail = await fetchDetail(component);

      return { default: () => <DetailBody detail={detail} /> };
    }),
  ]),
);
