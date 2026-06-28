/**
 * Client-side registry of the live example/demo components, keyed by the same
 * `SourceRef` the docs registry uses (`./<slug>/<name>.example.tsx`,
 * `./<slug>/demo.tsx`).
 *
 * The detail route loads a component's doc DATA in its route loader and ships it
 * as serialized loader data — but a `React.lazy` component cannot survive that
 * serialization boundary, so the live preview component is looked up here by ref
 * instead of travelling through loader data. Each ref maps to a `React.lazy`
 * handle; because every `doc.ts` statically imports its example files, the
 * underlying modules already ride in that component's doc chunk, so the lazy
 * usually resolves without a visible fallback once the loader's chunk has loaded.
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
 * Live components captured while `loadDoc` resolves a doc (it holds the real
 * `Demo` before stripping it for serialization). Lets the detail page render a
 * preview synchronously after a client navigation — the loader ran in the
 * browser, so the component is already in hand and `React.lazy`'s pending cycle
 * (a one-frame fallback flash) is skipped. Empty at SSR-hydration time (the
 * loader ran on the server), where `EXAMPLE_COMPONENT_BY_REF` takes over.
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
