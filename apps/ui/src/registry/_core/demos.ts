/**
 * Maps each component slug to its code-split demo + a loader for the demo's
 * highlighted source, for the `/components` showcase. Auto-discovered from
 * `registry/<slug>/demo.tsx`. Nothing is eager — demos load on scroll, sources
 * only when a Code tab opens — so any route can import this cheaply.
 *
 * To add a demo: create `registry/<slug>/demo.tsx` exporting one component; the
 * folder name is the key and must match its `meta.ts`.
 */
import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

import type { HighlightedSource } from "#/registry/_core/highlight";
import { getHighlightedSources } from "#/registry/_core/highlight-source";

export interface DemoEntry {
  /** Code-split demo — render inside `<Suspense>`; the chunk loads on first render. */
  readonly Demo: LazyExoticComponent<ComponentType>;
  /** Awaits the demo's raw source + pre-highlighted HTML (Code tab). */
  readonly loadSource: () => Promise<HighlightedSource>;
}

/** Live demo module loaders, keyed by path e.g. `./button/demo.tsx`. */
const demoModules = import.meta.glob<Record<string, unknown>>("../*/demo.tsx");

/** `./button/demo.tsx` → `button` — the slug is the component's folder name. */
function slugFromDemoPath(path: string): string {
  const slug = path.split("/")[1];

  if (!slug) {
    throw new Error(`Cannot derive a component slug from demo path "${path}".`);
  }

  return slug;
}

/** The demo file's single component export. */
function componentFrom(module: Record<string, unknown>, path: string): ComponentType {
  const Demo = Object.values(module).find((value) => typeof value === "function") as ComponentType | undefined;

  if (!Demo) {
    throw new Error(`Demo file ${path} must export exactly one component.`);
  }

  return Demo;
}

/** Demo entries keyed by the component slug (see `meta.ts`). */
export const DEMO_BY_SLUG: ReadonlyMap<string, DemoEntry> = new Map(
  Object.entries(demoModules).map(([path, loadModule]): [string, DemoEntry] => {
    const load = async (): Promise<ComponentType> => componentFrom(await loadModule(), path);

    return [
      slugFromDemoPath(path),
      {
        Demo: lazy(async () => ({ default: await load() })),
        loadSource: async () => {
          const sources = await getHighlightedSources({ data: [path] });
          const source = sources[path];

          if (!source) {
            throw new Error(`Missing highlighted source for ref "${path}".`);
          }

          return source;
        },
      },
    ];
  }),
);
