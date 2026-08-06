/** Installs the `Map.getOrInsert` polyfill once, from where the client build cannot follow it. */

let installing: Promise<unknown> | undefined;

/**
 * Awaits the polyfill before the first container is built.
 *
 * @remarks A top-level `import "…/map-get-or-insert"` survives the server-function extraction and
 * ships to the browser, which has no use for it. Importing from inside a handler does not.
 */
export function ensureMapPolyfill(): Promise<unknown> {
  return (installing ??= import("#/features/di/server/map-get-or-insert"));
}
