/**
 * The detail page's data: what the `$slug` route loader awaits. Deliberately free of UI and registry-map
 * imports — the route module is part of every page's critical chunk, so anything imported here ships site-wide.
 */
import type { ComponentMeta } from "#/registry/_core/components";
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
  // The registries' lazy-import maps stay out of this module's static graph, so the `$slug` route —
  // part of every page's critical chunk — does not carry them.
  const [{ loadDoc }, { DEMO_BY_SLUG }] = await Promise.all([
    import("#/registry/_core/docs"),
    import("#/registry/_core/demos"),
  ]);
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
