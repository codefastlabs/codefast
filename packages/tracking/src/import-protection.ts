/**
 * The `@codefast/tracking` subpaths every client bundle must deny (picomatch patterns) —
 * framework-neutral data each build tool maps to its own guard: TanStack Start's
 * `importProtection.client.specifiers`, Next's `server-only`, Remix's `.server` convention.
 * Ships and versions with the package instead of going stale in each consumer's config.
 * Nothing in this package imports it — its consumers are app build configs (see apps/ui
 * vite.config.ts).
 *
 * @example
 * ```ts
 * tanstackStart({
 *   importProtection: { client: { specifiers: [...SERVER_ONLY_SUBPATHS] } },
 * });
 * ```
 *
 * @since 1.0.0-canary.6
 */
export const SERVER_ONLY_SUBPATHS: ReadonlyArray<string> = [
  "@codefast/tracking/server",
  "@codefast/tracking/server/**",
  "@codefast/tracking/tanstack-start",
];
