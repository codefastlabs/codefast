/**
 * Lazy demo registry: maps each component slug to a code-split live demo and a
 * loader for its build-time-highlighted source, for the `/components` showcase.
 *
 * AUTO-DISCOVERED — every `examples/<slug>.demo.tsx` is registered by its
 * filename; there is no hand-maintained list to keep in sync. Nothing here
 * is eager: each demo is its own chunk that downloads when its card scrolls into
 * view (`<LazyVisible>` + `React.lazy`), and each source (`?shiki`, raw text +
 * pre-highlighted HTML) downloads only when a Code tab opens. Importing this
 * module costs ~nothing, so any route may use it.
 *
 * TO ADD A DEMO: create `examples/<slug>.demo.tsx` exporting a single
 * component. The `<slug>` (filename minus `.demo.tsx`) becomes the registry key
 * and must match a `<slug>.meta.ts` file (see `meta.ts`). The dot separates the
 * slug from the file role, so hyphenated slugs (`alert-dialog`) stay
 * unambiguous; rich docs may reference the same file via
 * `docSource(slug, "demo")`.
 */
import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

import type { HighlightedSource } from "#/lib/highlight";

export interface DemoEntry {
  /** Code-split demo — render inside `<Suspense>`; the chunk loads on first render. */
  readonly Demo: LazyExoticComponent<ComponentType>;
  /** Awaits the demo component itself (detail-page fallback example). */
  readonly load: () => Promise<ComponentType>;
  /** Awaits the demo's raw source + pre-highlighted HTML (Code tab). */
  readonly loadSource: () => Promise<HighlightedSource>;
}

/** Live demo module loaders, keyed by path e.g. `./button.demo.tsx`. */
const demoModules = import.meta.glob<Record<string, unknown>>("./*.demo.tsx");

/** The same files pre-highlighted at build time (`?shiki`), keyed identically. */
const demoSources = import.meta.glob<HighlightedSource>("./*.demo.tsx", { query: "?shiki" });

/** `./button.demo.tsx` → `button`. */
function slugFromDemoPath(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.demo\.tsx$/, "");
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
    const loadSource = demoSources[path];

    if (!loadSource) {
      throw new Error(`Demo file ${path} has no ?shiki source module.`);
    }

    return [
      slugFromDemoPath(path),
      {
        Demo: lazy(async () => ({ default: await load() })),
        load,
        loadSource,
      },
    ];
  }),
);
