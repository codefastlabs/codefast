/** Pure transforms that strip a package's source lane from a publish artifact. */

/**
 * What slimming one manifest removed.
 */
export interface ManifestSlimReport {
  readonly filesSrcRemoved: boolean;
  readonly exportsSourceRemoved: number;
  readonly importsSourceRemoved: number;
  readonly changed: boolean;
}

/**
 * The slimmed manifest paired with the report of what it dropped.
 */
export interface SlimManifestResult {
  readonly manifest: Record<string, unknown>;
  readonly report: ManifestSlimReport;
}

/**
 * The result of stripping the `sourceMappingURL` directive from an emitted file's text.
 */
export interface StripCommentResult {
  readonly text: string;
  readonly stripped: boolean;
}

/**
 * The emitted-file extensions that may carry a `sourceMappingURL` directive.
 */
export const MAP_ANNOTATED_EXTENSIONS: ReadonlySet<string> = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".d.ts",
  ".d.mts",
  ".d.cts",
]);

/**
 * Whether a dist entry is a source-map sidecar (`*.map`).
 */
export function isSourceMapFile(fileName: string): boolean {
  return fileName.endsWith(".map");
}

/**
 * Whether a dist entry is an emitted file that may carry a `sourceMappingURL` directive.
 */
export function isMapAnnotatedFile(fileName: string): boolean {
  for (const extension of MAP_ANNOTATED_EXTENSIONS) {
    if (fileName.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

/**
 * Produces a publish manifest with `src` dropped from `files` and every `source` export/import condition removed.
 *
 * @remarks Operates on a structural clone, so the caller's manifest is left intact. A consumer never enables the
 * `source` condition and resolves `#/` through `types`/`default` to `dist`, so dropping the source lane and the shipped
 * sources it points at leaves the published surface whole.
 */
export function slimPublishManifest(manifest: Record<string, unknown>): SlimManifestResult {
  const draft = structuredClone(manifest);

  const filesSrcRemoved = removeSrcFromFiles(draft);
  const exportsSourceRemoved = deleteSourceConditions(draft.exports);
  const importsSourceRemoved = deleteSourceConditions(draft.imports);
  const changed = filesSrcRemoved || exportsSourceRemoved > 0 || importsSourceRemoved > 0;

  return {
    manifest: draft,
    report: { filesSrcRemoved, exportsSourceRemoved, importsSourceRemoved, changed },
  };
}

/**
 * Strips every `sourceMappingURL` directive line from an emitted file's text.
 */
export function stripSourceMappingComment(text: string): StripCommentResult {
  const lines = text.split("\n");
  const kept = lines.filter((line) => !/^\s*\/\/# sourceMappingURL=/.test(line));
  if (kept.length === lines.length) {
    return { text, stripped: false };
  }
  return { text: kept.join("\n"), stripped: true };
}

function removeSrcFromFiles(manifest: Record<string, unknown>): boolean {
  const files = manifest.files;
  if (!Array.isArray(files)) {
    return false;
  }
  const next = files.filter((entry) => entry !== "src");
  if (next.length === files.length) {
    return false;
  }
  manifest.files = next;
  return true;
}

// Walks a conditions tree deleting every `source` key. A subpath key always starts with ".", so only real
// condition objects match, and a source-only entry never occurs here, so no node is left empty.
function deleteSourceConditions(node: unknown): number {
  if (Array.isArray(node)) {
    let removed = 0;
    for (const item of node) {
      removed += deleteSourceConditions(item);
    }
    return removed;
  }
  if (node === null || typeof node !== "object") {
    return 0;
  }
  const record = node as Record<string, unknown>;
  let removed = 0;
  if ("source" in record) {
    delete record.source;
    removed += 1;
  }
  for (const key of Object.keys(record)) {
    removed += deleteSourceConditions(record[key]);
  }
  return removed;
}
