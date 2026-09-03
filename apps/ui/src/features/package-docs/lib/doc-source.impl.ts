/**
 * Server-only access to the packages' manifests and markdown. Both are bundled at build through
 * `import.meta.glob` — the deployed function has no `packages/` directory to read — and imported only
 * behind the server functions, so neither the raw documents nor the manifests reach a client chunk.
 */
import { DOC_KINDS, docRefFor } from "#/features/package-docs/lib/doc-kinds";
import type { DocKind, DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { PackageDoc, PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface PackageManifest {
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly license?: string;
}

/** One markdown source: where it lives in the package, and how to read it. */
export interface DocSource {
  /** Relative to the package directory, e.g. `spec/spec-consent.md`. */
  readonly file: string;
  readonly load: () => Promise<string>;
}

/** The sources one kind of a package is served from: its own page and the pages beneath it. */
interface KindSources {
  index: DocSource | undefined;
  readonly pages: Map<string, DocSource>;
}

const PACKAGES_PREFIX = "../../../../../../packages/";

// `packages/*` holds only published packages (private ones live in `internal/`), so no `private` filter.
const manifests = import.meta.glob<PackageManifest>("../../../../../../packages/*/package.json", {
  eager: true,
  import: "default",
});

const rootDocs = import.meta.glob<string>("../../../../../../packages/*/*.md", { query: "?raw", import: "default" });

// A glob must be a literal, so the braces spell out `DOC_KINDS`' slugs. A kind added there but not here
// still fails loudly: `vite.config.ts` lists its pages for prerendering and the build 404s on them.
const nestedDocs = import.meta.glob<string>(
  "../../../../../../packages/*/{readme,spec,architecture,decisions,learning,contributing,changelog}/**/*.md",
  { query: "?raw", import: "default" },
);

/** `../../../../../../packages/tracking/spec/README.md` → `["tracking", "spec/README.md"]`. */
function packageAndFile(globPath: string): [pkg: string, file: string] {
  const relative = globPath.startsWith(PACKAGES_PREFIX) ? globPath.slice(PACKAGES_PREFIX.length) : "";
  const slash = relative.indexOf("/");

  if (slash <= 0 || slash === relative.length - 1) {
    throw new Error(`Cannot derive a package and file from glob path "${globPath}".`);
  }

  return [relative.slice(0, slash), relative.slice(slash + 1)];
}

function upsert<Key, Value>(map: Map<Key, Value>, key: Key, create: () => Value): Value {
  const existing = map.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const created = create();

  map.set(key, created);

  return created;
}

const sourcesByPackage: ReadonlyMap<string, ReadonlyMap<DocKindSlug, KindSources>> = (() => {
  const byPackage = new Map<string, Map<DocKindSlug, KindSources>>();

  for (const [globPath, load] of Object.entries({ ...rootDocs, ...nestedDocs })) {
    const [pkg, file] = packageAndFile(globPath);
    const ref = docRefFor(file);

    if (!ref) {
      continue;
    }

    const kinds = upsert(byPackage, pkg, () => new Map<DocKindSlug, KindSources>());
    const sources = upsert(kinds, ref.kind, () => ({ index: undefined, pages: new Map<string, DocSource>() }));
    const taken = ref.page === undefined ? sources.index : sources.pages.get(ref.page);

    if (taken) {
      throw new Error(`packages/${pkg}: "${taken.file}" and "${file}" both publish the same "${ref.kind}" page.`);
    }

    if (ref.page === undefined) {
      sources.index = { file, load };
    } else {
      sources.pages.set(ref.page, { file, load });
    }
  }

  for (const [pkg, kinds] of byPackage) {
    for (const [slug, sources] of kinds) {
      if (!sources.index) {
        throw new Error(`packages/${pkg}: the "${slug}" directory has no README.md to serve as its page.`);
      }
    }
  }

  return byPackage;
})();

/** Every published package with the documents it ships, sorted by name. */
export const PACKAGES: ReadonlyArray<PackageSummary> = Object.entries(manifests)
  .map(([globPath, manifest]): PackageSummary => {
    const [pkg] = packageAndFile(globPath);
    const kinds = sourcesByPackage.get(pkg);

    return {
      slug: pkg,
      name: manifest.name,
      description: manifest.description ?? "",
      version: manifest.version,
      license: manifest.license ?? "MIT",
      docs: DOC_KINDS.flatMap((kind): Array<PackageDoc> => {
        const sources = kinds?.get(kind.slug);

        return sources ? [{ kind: kind.slug, pages: [...sources.pages.keys()].toSorted() }] : [];
      }),
    };
  })
  .toSorted((a, b) => a.name.localeCompare(b.name));

/** The packages whose docs render under `/docs/<pkg>` — every published package except `ui`, which has its own site section. */
export const DOC_PACKAGES: ReadonlyArray<PackageSummary> = PACKAGES.filter((pkg) => pkg.slug !== "ui");

/** The source of one document, or `null` when the package, kind, or page does not exist. */
export function docSource(pkg: string, kind: DocKindSlug, page?: string): DocSource | null {
  if (pkg === "ui") {
    return null;
  }

  const sources = sourcesByPackage.get(pkg)?.get(kind);

  if (!sources) {
    return null;
  }

  return (page === undefined ? sources.index : sources.pages.get(page)) ?? null;
}

/** The kind record for a slug, throwing on an unknown one — callers narrow with `isDocKindSlug` first. */
export function docKind(slug: DocKindSlug): DocKind {
  const kind = DOC_KINDS.find((candidate) => candidate.slug === slug);

  if (!kind) {
    throw new Error(`Unknown doc kind "${slug}".`);
  }

  return kind;
}
