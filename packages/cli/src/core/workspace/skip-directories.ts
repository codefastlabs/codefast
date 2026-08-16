/**
 * Directory names every workspace walk skips: build output, vendored trees, and tool caches.
 */
export const defaultSkipDirectoryNames: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  ".git",
  ".turbo",
  ".next",
  ".cache",
  "out",
  "build",
  "coverage",
  ".vercel",
  ".output",
]);
