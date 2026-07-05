import type { HighlightedSource } from "#/lib/highlight";
/**
 * Lazy rich-doc registry for the detail page (`/components/$slug`), keyed by slug.
 * Auto-discovered from `registry/<slug>/doc.ts`; lazy, so importing this is ~free.
 * Components without a doc fall back to the card demo from `demos.ts`. To add one:
 * export a `ComponentDoc` from `doc.ts` pointing at example files via `docSource`.
 */
import { rememberExampleComponent } from "#/registry/_core/examples";
import { getHighlightedSources } from "#/registry/_core/highlight-source";
import type { ComponentDoc, ResolvedComponentDoc, ResolvedDocExample, SourceRef } from "#/registry/_core/types";

export type {
  ApiGroup,
  ComponentDoc,
  DocExample,
  ResolvedComponentDoc,
  ResolvedDocExample,
  SourceRef,
} from "#/registry/_core/types";

/** Doc module loaders, keyed by path e.g. `./button/doc.ts`. */
const docModules = import.meta.glob<Record<string, unknown>>("../*/doc.ts");

/** `./button/doc.ts` → `button` — the slug is the component's folder name. */
function slugFromDocPath(path: string): string {
  const slug = path.split("/")[1];

  if (!slug) {
    throw new Error(`Cannot derive a component slug from doc path "${path}".`);
  }

  return slug;
}

const docLoadersBySlug = new Map(Object.entries(docModules).map(([path, load]) => [slugFromDocPath(path), load]));

/** Slugs that ship a rich doc — known synchronously from the glob keys. */
export const DOC_SLUGS: ReadonlySet<string> = new Set(docLoadersBySlug.keys());

/** Looks up a batch-resolved source, throwing if the batch didn't include `ref`. */
function requireSource(sources: Record<SourceRef, HighlightedSource>, ref: SourceRef): HighlightedSource {
  const source = sources[ref];

  if (!source) {
    throw new Error(`Missing highlighted source for ref "${ref}".`);
  }

  return source;
}

function resolveExample(
  example: ComponentDoc["examples"][number],
  sources: Record<SourceRef, HighlightedSource>,
): ResolvedDocExample {
  // Drop the live `Demo` — loader data is serialized across the SSR boundary and
  // a component function would not survive it. Stash the component first so a
  // client render can use it synchronously; otherwise the preview re-resolves it
  // from `EXAMPLE_COMPONENT_BY_REF` via `source` (kept below).
  const { Demo, ...serializable } = example;

  rememberExampleComponent(example.source, Demo);

  return { ...serializable, ...requireSource(sources, example.source) };
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

  // One round trip for every ref this doc needs, instead of one per example.
  const refs = [...doc.examples.map((example) => example.source), ...(doc.usage ? [doc.usage] : [])];
  const sources = await getHighlightedSources({ data: [...new Set(refs)] });

  const examples = doc.examples.map((example) => resolveExample(example, sources));
  const usage = doc.usage ? requireSource(sources, doc.usage) : undefined;

  // `anatomy` is plain tree data — it rides through `...doc` unchanged.
  return { ...doc, examples, usage };
}
