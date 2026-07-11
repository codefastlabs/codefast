/**
 * Import specifiers (picomatch patterns) every client bundle must deny — spread into
 * TanStack Start's `importProtection.client.specifiers` so the deny-list ships and
 * versions with the package instead of going stale in each consumer's config. Nothing in
 * this package imports it — its consumers are app build configs (see apps/ui vite.config.ts).
 *
 * @example
 * ```ts
 * tanstackStart({
 *   importProtection: { client: { specifiers: [...SERVER_ONLY_IMPORT_SPECIFIERS] } },
 * });
 * ```
 */
export const SERVER_ONLY_IMPORT_SPECIFIERS: ReadonlyArray<string> = [
  "@codefast/tracking/server",
  "@codefast/tracking/server/**",
  "@codefast/tracking/tanstack-start",
];
