/**
 * Heavy demo registry: maps each component slug to its live card demo and its raw
 * source string, for the `/components` showcase grid.
 *
 * AUTO-DISCOVERED — every `examples/<category>/<slug>-demo.tsx` is registered by
 * its filename; there is no hand-maintained list to keep in sync. `import.meta.glob`
 * eagerly pulls in every demo (recharts, embla, @daypicker/react, …), so this module
 * must ONLY be imported by the `/components` route — never by lightweight metadata
 * consumers like the home page or the header ⌘K palette.
 *
 * TO ADD A DEMO: create `examples/<category>/<slug>-demo.tsx` exporting a single
 * component. The `<slug>` (filename minus `-demo`) becomes the registry key and must
 * match a `slug` in `src/data/components.ts`.
 */
import type { ComponentType } from "react";

export interface DemoEntry {
  readonly Demo: ComponentType;
  readonly code: string;
}

/** Live demo modules, keyed by path e.g. `./form/button-demo.tsx`. */
const demoModules = import.meta.glob<Record<string, unknown>>("./*/*-demo.tsx", {
  eager: true,
});

/** The same files as raw source strings (Vite `?raw`), keyed identically. */
const demoSources = import.meta.glob("./*/*-demo.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

/** `./form/button-demo.tsx` → `button`. */
function slugFromDemoPath(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/-demo\.tsx$/, "");
}

/** Keyed by the component `slug` from `src/data/components.ts`. */
export const DEMOS: Record<string, DemoEntry> = Object.fromEntries(
  Object.entries(demoModules).map(([path, module]) => {
    const slug = slugFromDemoPath(path);
    const Demo = Object.values(module).find((value) => typeof value === "function") as ComponentType | undefined;

    if (!Demo) {
      throw new Error(`Demo file ${path} must export exactly one component.`);
    }

    return [slug, { Demo, code: (demoSources[path] as string | undefined) ?? "" }];
  }),
);
