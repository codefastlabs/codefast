/**
 * Live example/demo components keyed by `SourceRef`. The detail route ships doc
 * data as serialized loader data, which a `React.lazy` component can't cross — so
 * previews are looked up here by ref instead. Since `doc.ts` statically imports
 * its examples, they already ride in the doc chunk, so the lazy usually resolves
 * without a fallback flash.
 */
import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

import type { SourceRef } from "#/registry/types";

/** Live example/demo module loaders, keyed by path e.g. `./button/default.example.tsx`. */
const exampleModules = import.meta.glob<Record<string, unknown>>(["./*/*.example.tsx", "./*/demo.tsx"]);

/** The single component export of an example/demo module. */
function componentFrom(module: Record<string, unknown>, path: string): ComponentType {
  const Demo = Object.values(module).find((value) => typeof value === "function") as ComponentType | undefined;

  if (!Demo) {
    throw new Error(`Example file ${path} must export exactly one component.`);
  }

  return Demo;
}

/** Lazy preview component keyed by its `SourceRef` (see `registry/source.ts`). */
export const EXAMPLE_COMPONENT_BY_REF: ReadonlyMap<SourceRef, LazyExoticComponent<ComponentType>> = new Map(
  Object.entries(exampleModules).map(([path, loadModule]) => [
    path,
    lazy(async () => ({ default: componentFrom(await loadModule(), path) })),
  ]),
);

/**
 * Live components captured during `loadDoc`, before serialization strips them.
 * Lets a client-nav render the preview synchronously (component already in hand,
 * skipping React.lazy's one-frame fallback). Empty at SSR hydration, where
 * `EXAMPLE_COMPONENT_BY_REF` takes over.
 */
const loadedByRef = new Map<SourceRef, ComponentType>();

/** Records a live example component so a same-session client render can skip `React.lazy`. */
export function rememberExampleComponent(ref: SourceRef, component: ComponentType): void {
  loadedByRef.set(ref, component);
}

/** The synchronously-available example component for `ref`, if loaded this session. */
export function getLoadedExampleComponent(ref: SourceRef): ComponentType | undefined {
  return loadedByRef.get(ref);
}
