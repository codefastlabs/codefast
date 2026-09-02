/**
 * Rewrites the repo-relative links a package's markdown carries so they resolve on the site: a sibling
 * doc becomes its `/docs/<pkg>/<kind>` page, anything else in the repo points at GitHub.
 */
import { DOC_KIND_BY_FILE, docPath } from "#/features/package-docs/lib/doc-kinds";
import { GITHUB_URL } from "#/lib/nav-links";

/** Where a link was written: the package and the document, so relative paths resolve from its directory. */
export interface LinkContext {
  readonly pkg: string;
  readonly file: string;
}

/** Packages whose docs live elsewhere on the site than `/docs/<pkg>`. */
const SITE_PATH_BY_PACKAGE: ReadonlyMap<string, string> = new Map([["ui", "/ui"]]);

const EXTERNAL_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** Joins and normalises a posix path, resolving `.` and `..` segments. */
function normalizePath(...parts: ReadonlyArray<string>): string {
  const segments: Array<string> = [];

  for (const segment of parts.join("/").split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }

    if (segment === "..") {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }

  return segments.join("/");
}

/** Resolves `href` from `packages/<pkg>/<file>` to a repo-root-relative path. */
function resolveRepoPath(href: string, context: LinkContext): string {
  if (href.startsWith("/")) {
    return normalizePath(href);
  }

  const directory = normalizePath("packages", context.pkg, context.file, "..");

  return normalizePath(directory, href);
}

/** Splits `href` into its path and `#hash` (including the `#`). */
function splitHash(href: string): { path: string; hash: string } {
  const hashAt = href.indexOf("#");

  return hashAt === -1 ? { path: href, hash: "" } : { path: href.slice(0, hashAt), hash: href.slice(hashAt) };
}

/** The site page for a resolved `packages/<pkg>[/<FILE>.md]` path, or `null` when it is not a doc page. */
function sitePathFor(repoPath: string): string | null {
  const match = /^packages\/([^/]+)(?:\/([^/]+))?$/.exec(repoPath);

  if (!match) {
    return null;
  }

  const [, pkg, file] = match;

  if (!pkg) {
    return null;
  }

  const overridden = SITE_PATH_BY_PACKAGE.get(pkg);

  if (file === undefined) {
    return overridden ?? docPath(pkg, "readme");
  }

  const kind = DOC_KIND_BY_FILE.get(file);

  if (!kind) {
    return null;
  }

  return overridden ?? docPath(pkg, kind.slug);
}

/**
 * Maps a markdown `href` to what the site should link to.
 *
 * External URLs and in-page anchors pass through. A repo-relative path resolves from the document's
 * directory: a package's doc file (or its directory) becomes the site page, any other file a GitHub
 * `blob` link, and a directory a GitHub `tree` link — with the original `#hash` kept.
 */
export function rewriteDocLink(href: string, context: LinkContext): string {
  if (href === "" || href.startsWith("#") || EXTERNAL_HREF.test(href)) {
    return href;
  }

  const { path, hash } = splitHash(href);
  const repoPath = resolveRepoPath(path, context);
  const sitePath = sitePathFor(repoPath);

  if (sitePath !== null) {
    return `${sitePath}${hash}`;
  }

  const lastSegment = repoPath.split("/").at(-1) ?? "";
  const kind = lastSegment.includes(".") ? "blob" : "tree";

  return `${GITHUB_URL}/${kind}/main/${repoPath}${hash}`;
}

/** Maps a markdown image `src` to a URL that serves the raw file — relative images have no home on the site. */
export function rewriteDocImage(src: string, context: LinkContext): string {
  if (src === "" || EXTERNAL_HREF.test(src) || src.startsWith("data:")) {
    return src;
  }

  return `https://raw.githubusercontent.com/codefastlabs/codefast/main/${resolveRepoPath(src, context)}`;
}
