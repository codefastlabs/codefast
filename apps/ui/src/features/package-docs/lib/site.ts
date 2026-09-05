/**
 * The published packages' external homes, shared by the landing cards, the docs header, and `llms.txt`.
 */
import { GITHUB_URL } from "#/lib/nav-links";

/** A repo file on GitHub, at `main`. */
export function repoBlobUrl(repoPath: string): string {
  return `${GITHUB_URL}/blob/main/${repoPath}`;
}

/** The package's npm page. */
export function packageNpmUrl(name: string): string {
  return `https://www.npmjs.com/package/${name}`;
}
