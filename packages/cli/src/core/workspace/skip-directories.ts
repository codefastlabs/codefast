/**
 * Directory names every workspace walk skips: build output, vendored trees, and tool caches.
 *
 * @since 0.6.0
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
  ".tanstack",
  ".nitro",
]);
