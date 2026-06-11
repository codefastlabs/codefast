/**
 * Lazy rich-documentation registry for the per-component detail page
 * (`/components/$slug`), keyed by the component `slug` from `data/components.ts`.
 *
 * AUTO-DISCOVERED — every `examples/<slug>.doc.ts` is registered by its
 * filename; there is no hand-maintained list. Nothing here is eager: a doc (and
 * the example components + sources it pulls in) is its own chunk, loaded by
 * `loadDoc(slug)` only when that component's detail page renders.
 * Importing this module costs ~nothing, so any route may use it.
 *
 * Components without a doc fall back to the single card demo from `demos.tsx`,
 * so every detail page still renders.
 *
 * FILE NAMING — everything for a component lives flat in `examples/`. Dots
 * separate the structural segments (slug, example name, role suffix); hyphens
 * only ever appear inside a segment, so kebab-case slugs stay unambiguous:
 *   `<slug>.doc.ts`        the doc (this registry's key source)
 *   `<slug>.demo.tsx`      the showcase card demo (see `demos.tsx`)
 *   `<slug>.<example>.tsx` one file per doc example
 *   `<slug>.anatomy.txt`   the composition skeleton
 *
 * TO ADD A COMPONENT: create its example files plus a `<slug>.doc.ts` exporting
 * a single `ComponentDoc` whose examples point at their files via
 * `docSource(slug, name)` / `docAnatomy(slug)`. The doc is then picked up
 * automatically; no registration is needed.
 */
import type { ComponentDoc, ResolvedComponentDoc, ResolvedDocExample, SourceRef } from "#/components/examples/types";
import type { HighlightedSource } from "#/lib/highlight";

export type {
  ApiGroup,
  ComponentDoc,
  DocExample,
  ResolvedComponentDoc,
  ResolvedDocExample,
  SourceRef,
} from "#/components/examples/types";

/** Doc module loaders, keyed by path e.g. `./button.doc.ts`. */
const docModules = import.meta.glob<Record<string, unknown>>("./*.doc.ts");

/** Every example/anatomy file pre-highlighted at build time, keyed by SourceRef. */
const sourceModules = import.meta.glob<HighlightedSource>(["./*.{tsx,txt}", "!./demos.tsx"], { query: "?shiki" });

/** `./button.doc.ts` → `button`. */
function slugFromDocPath(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.doc\.ts$/, "");
}

const docLoadersBySlug = new Map(Object.entries(docModules).map(([path, load]) => [slugFromDocPath(path), load]));

/** Slugs that ship a rich doc — known synchronously from the glob keys. */
export const DOC_SLUGS: ReadonlySet<string> = new Set(docLoadersBySlug.keys());

async function loadSource(ref: SourceRef): Promise<HighlightedSource> {
  const load = sourceModules[ref];

  if (!load) {
    throw new Error(`No source file for ref "${ref}" under examples/.`);
  }

  return load();
}

async function resolveExample(example: ComponentDoc["examples"][number]): Promise<ResolvedDocExample> {
  const { code, html } = await loadSource(example.source);

  return { ...example, code, html };
}

/**
 * Loads a component's doc chunk and resolves every source ref to its raw text
 * and pre-highlighted HTML. Returns `undefined` for components without a doc.
 */
export async function loadDoc(slug: string): Promise<ResolvedComponentDoc | undefined> {
  const loadModule = docLoadersBySlug.get(slug);

  if (!loadModule) {
    return undefined;
  }

  const module = await loadModule();
  const doc = Object.values(module).find((value) => value !== null && typeof value === "object") as
    | ComponentDoc
    | undefined;

  if (!doc) {
    throw new Error(`Doc module for "${slug}" must export exactly one ComponentDoc.`);
  }

  const [examples, anatomy] = await Promise.all([
    Promise.all(doc.examples.map(resolveExample)),
    doc.anatomy === undefined ? undefined : loadSource(doc.anatomy),
  ]);

  return { ...doc, examples, anatomy };
}
