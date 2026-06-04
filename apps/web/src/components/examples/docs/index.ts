/**
 * Aggregated rich-documentation registry for the per-component detail page
 * (`/components/$slug`), keyed by the component `slug` from `data/components.ts`.
 *
 * AUTO-DISCOVERED — every `docs/<slug>/<slug>.doc.ts` is registered by its folder
 * name; there is no hand-maintained list. Like `demos.tsx`, this barrel eagerly
 * imports heavy example components, so it must ONLY be imported by the `$slug`
 * route — never by lightweight metadata consumers.
 *
 * Components without a doc fall back to the single card demo from `demos.tsx`, so
 * every detail page still renders.
 *
 * TO ADD A COMPONENT
 * 1. Create `docs/<slug>/` with one file per example, an `anatomy.txt` skeleton,
 *    and a `<slug>.doc.ts` exporting a single `ComponentDoc`.
 * 2. Register the example sources AND `anatomy.txt` in `../codes.ts` (the single
 *    ?raw barrel) — no source code is ever stored as a string literal.
 * The doc is then picked up automatically; no registration here is needed.
 */
import type { ComponentDoc } from "#/components/examples/docs/types";

export type { ApiGroup, ComponentDoc, DocExample } from "#/components/examples/docs/types";

/** Doc modules, keyed by path e.g. `./button/button.doc.ts`. */
const docModules = import.meta.glob<Record<string, unknown>>("./*/*.doc.ts", {
  eager: true,
});

/** `./button/button.doc.ts` → `button`. */
function slugFromDocPath(path: string): string {
  const segments = path.split("/");

  return segments[segments.length - 2] ?? "";
}

export const COMPONENT_DOCS: Record<string, ComponentDoc> = Object.fromEntries(
  Object.entries(docModules).map(([path, module]) => {
    const doc = Object.values(module).find(
      (value) => value !== null && typeof value === "object",
    ) as ComponentDoc | undefined;

    if (!doc) {
      throw new Error(`Doc file ${path} must export exactly one ComponentDoc.`);
    }

    return [slugFromDocPath(path), doc];
  }),
);
