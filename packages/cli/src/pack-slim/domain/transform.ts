/** Pure transforms that slim a package's manifest and dist for publish. */

/**
 * What slimming one manifest removed.
 */
interface ManifestSlimReport {
  readonly filesSrcRemoved: boolean;
  readonly exportsSourceRemoved: number;
  readonly importsSourceRemoved: number;
  readonly importsUnshippedRemoved: number;
  readonly scriptsRemoved: number;
  readonly devDependenciesRemoved: number;
  readonly changed: boolean;
}

/**
 * The slimmed manifest paired with the report of what it dropped.
 *
 * @since 0.8.1
 */
export interface SlimManifestResult {
  readonly manifest: Record<string, unknown>;
  readonly report: ManifestSlimReport;
}

/**
 * The result of stripping the `sourceMappingURL` directive from an emitted file's text.
 *
 * @since 0.8.1
 */
export interface StripCommentResult {
  readonly text: string;
  readonly stripped: boolean;
}

/**
 * The emitted-file extensions that may carry a `sourceMappingURL` directive.
 */
const MAP_ANNOTATED_EXTENSIONS: ReadonlySet<string> = new Set([".js", ".mjs", ".cjs", ".d.ts", ".d.mts", ".d.cts"]);

/**
 * The script names npm and pnpm run on their own, on a consumer's install or on this package's publish.
 */
const LIFECYCLE_SCRIPT_STEMS: ReadonlySet<string> = new Set([
  "install",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "pack",
  "publish",
]);

/**
 * The characters that make a `files` entry a glob rather than a path.
 */
const GLOB_CHARACTERS = /[*?[\]{}]/;

/**
 * Whether a dist entry is a source-map sidecar (`*.map`).
 *
 * @since 0.8.1
 */
export function isSourceMapFile(fileName: string): boolean {
  return fileName.endsWith(".map");
}

/**
 * Whether a dist entry is an emitted file that may carry a `sourceMappingURL` directive.
 *
 * @since 0.8.1
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
 * Whether a script name is an install or publish lifecycle hook, with or without its `pre`/`post` prefix.
 *
 * @remarks Publish hooks stay because `pnpm publish` runs them right after pack-slim; install hooks stay because a
 * consumer's package manager runs them.
 *
 * @since 0.9.0
 */
export function isLifecycleScript(name: string): boolean {
  if (LIFECYCLE_SCRIPT_STEMS.has(name)) {
    return true;
  }
  const stem = name.replace(/^(?:pre|post)/, "");
  return stem !== name && LIFECYCLE_SCRIPT_STEMS.has(stem);
}

/**
 * Produces a publish manifest carrying only what a consumer's `tsc` and Node read.
 *
 * @remarks Operates on a structural clone, so the caller's manifest is left intact. A consumer never enables `source`
 * and resolves `#/` through `types`/`default` to `dist`, so dropping the source lane, the `imports` left pointing
 * outside `files`, the scripts that are not lifecycle hooks, and `devDependencies` leaves the published surface whole.
 *
 * @since 0.8.1
 */
export function slimPublishManifest(manifest: Record<string, unknown>): SlimManifestResult {
  const draft = structuredClone(manifest);

  const filesSrcRemoved = removeSrcFromFiles(draft);
  const exportsSourceRemoved = deleteSourceConditions(draft.exports);
  const importsSourceRemoved = deleteSourceConditions(draft.imports);
  const importsUnshippedRemoved = deleteUnshippedImports(draft);
  const scriptsRemoved = deleteDevOnlyScripts(draft);
  const devDependenciesRemoved = deleteDevDependencies(draft);
  const changed = JSON.stringify(draft) !== JSON.stringify(manifest);

  return {
    manifest: draft,
    report: {
      filesSrcRemoved,
      exportsSourceRemoved,
      importsSourceRemoved,
      importsUnshippedRemoved,
      scriptsRemoved,
      devDependenciesRemoved,
      changed,
    },
  };
}

/**
 * Strips every `sourceMappingURL` directive line from an emitted file's text.
 *
 * @since 0.8.1
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

// Walks a conditions tree deleting every `source` key. A subpath key always starts with ".", so only real condition
// objects match; an `imports` entry this leaves empty is what the unshipped pass removes.
function deleteSourceConditions(node: unknown): number {
  if (Array.isArray(node)) {
    let removed = 0;
    for (const item of node) {
      removed += deleteSourceConditions(item);
    }
    return removed;
  }
  if (!isRecord(node)) {
    return 0;
  }
  let removed = 0;
  if ("source" in node) {
    delete node.source;
    removed += 1;
  }
  for (const key of Object.keys(node)) {
    removed += deleteSourceConditions(node[key]);
  }
  return removed;
}

// Keeps an `imports` entry only while one of its targets lands inside a path `files` ships. `files` is read after the
// `src` drop, so a lane still pointing at `./src/*` counts as unshipped; with no `files` at all npm ships everything.
function deleteUnshippedImports(manifest: Record<string, unknown>): number {
  const imports = manifest.imports;
  const files = manifest.files;
  if (!isRecord(imports) || !Array.isArray(files)) {
    return 0;
  }
  const shippedEntries = files.filter((entry): entry is string => typeof entry === "string");
  let removed = 0;
  for (const specifier of Object.keys(imports)) {
    const targets = collectTargets(imports[specifier]);
    if (targets.some((target) => isShippedTarget(target, shippedEntries))) {
      continue;
    }
    delete imports[specifier];
    removed += 1;
  }
  if (Object.keys(imports).length === 0) {
    delete manifest.imports;
  }
  return removed;
}

function collectTargets(node: unknown, into: Array<string> = []): Array<string> {
  if (typeof node === "string") {
    into.push(node);
  } else if (Array.isArray(node)) {
    for (const item of node) {
      collectTargets(item, into);
    }
  } else if (isRecord(node)) {
    for (const value of Object.values(node)) {
      collectTargets(value, into);
    }
  }
  return into;
}

// A glob entry is left to npm, so any target counts as shipped under it; a negated entry ships nothing.
function isShippedTarget(target: string, shippedEntries: ReadonlyArray<string>): boolean {
  const relativeTarget = stripDotSlash(target);
  return shippedEntries.some((entry) => {
    if (entry.startsWith("!")) {
      return false;
    }
    if (GLOB_CHARACTERS.test(entry)) {
      return true;
    }
    const shipped = stripDotSlash(entry).replace(/\/+$/, "");
    return relativeTarget === shipped || relativeTarget.startsWith(`${shipped}/`);
  });
}

function stripDotSlash(filePath: string): string {
  return filePath.startsWith("./") ? filePath.slice(2) : filePath;
}

// Drops every script that is not a lifecycle hook, and the field itself once nothing is left in it.
function deleteDevOnlyScripts(manifest: Record<string, unknown>): number {
  const scripts = manifest.scripts;
  if (!isRecord(scripts)) {
    return 0;
  }
  let removed = 0;
  for (const name of Object.keys(scripts)) {
    if (isLifecycleScript(name)) {
      continue;
    }
    delete scripts[name];
    removed += 1;
  }
  if (Object.keys(scripts).length === 0) {
    delete manifest.scripts;
  }
  return removed;
}

function deleteDevDependencies(manifest: Record<string, unknown>): number {
  const devDependencies = manifest.devDependencies;
  if (!isRecord(devDependencies)) {
    return 0;
  }
  delete manifest.devDependencies;
  return Object.keys(devDependencies).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
