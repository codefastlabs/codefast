/**
 * Server-only access to the packages' manifests and markdown. Both are bundled at build through
 * `import.meta.glob` — the deployed function has no `packages/` directory to read — and imported only
 * behind the server functions, so neither the raw documents nor the manifests reach a client chunk.
 */
import { DOC_KINDS, DOC_KIND_BY_FILE } from "#/features/package-docs/lib/doc-kinds";
import type { DocKind, DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

interface PackageManifest {
  readonly name: string;
  readonly description?: string;
  readonly version: string;
}

// `packages/*` holds only published packages (private ones live in `internal/`), so no `private` filter.
const manifests = import.meta.glob<PackageManifest>("../../../../../../packages/*/package.json", {
  eager: true,
  import: "default",
});

const rawDocs = import.meta.glob<string>("../../../../../../packages/*/*.md", { query: "?raw", import: "default" });

/** `../../../../../packages/di/SPEC.md` → `["di", "SPEC.md"]`. */
function packageAndFile(globPath: string): [pkg: string, file: string] {
  const segments = globPath.split("/");
  const file = segments.at(-1);
  const pkg = segments.at(-2);

  if (!pkg || !file) {
    throw new Error(`Cannot derive a package and file from glob path "${globPath}".`);
  }

  return [pkg, file];
}

const docLoadersByPackage: ReadonlyMap<string, ReadonlyMap<DocKindSlug, () => Promise<string>>> = (() => {
  const byPackage = new Map<string, Map<DocKindSlug, () => Promise<string>>>();

  for (const [globPath, load] of Object.entries(rawDocs)) {
    const [pkg, file] = packageAndFile(globPath);
    const kind = DOC_KIND_BY_FILE.get(file);

    if (!kind) {
      continue;
    }

    const loaders = byPackage.get(pkg) ?? new Map<DocKindSlug, () => Promise<string>>();

    loaders.set(kind.slug, load);
    byPackage.set(pkg, loaders);
  }

  return byPackage;
})();

/** Every published package with the documents it ships, sorted by name. */
export const PACKAGES: ReadonlyArray<PackageSummary> = Object.entries(manifests)
  .map(([globPath, manifest]): PackageSummary => {
    const [pkg] = packageAndFile(globPath);
    const loaders = docLoadersByPackage.get(pkg);

    return {
      slug: pkg,
      name: manifest.name,
      description: manifest.description ?? "",
      version: manifest.version,
      docs: DOC_KINDS.filter((kind) => loaders?.has(kind.slug)).map((kind) => kind.slug),
    };
  })
  .toSorted((a, b) => a.name.localeCompare(b.name));

/** The packages whose docs render under `/docs/<pkg>` — every published package except `ui`, which has its own site section. */
export const DOC_PACKAGES: ReadonlyArray<PackageSummary> = PACKAGES.filter((pkg) => pkg.slug !== "ui");

/** The raw markdown of one document, or `null` when the package or kind does not exist. */
export async function loadRawDoc(pkg: string, doc: DocKindSlug): Promise<string | null> {
  if (pkg === "ui") {
    return null;
  }

  const load = docLoadersByPackage.get(pkg)?.get(doc);

  return load ? load() : null;
}

/** The kind record for a slug, throwing on an unknown one — callers narrow with `isDocKindSlug` first. */
export function docKind(doc: DocKindSlug): DocKind {
  const kind = DOC_KINDS.find((candidate) => candidate.slug === doc);

  if (!kind) {
    throw new Error(`Unknown doc kind "${doc}".`);
  }

  return kind;
}
