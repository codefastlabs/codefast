/**
 * \@codefast/tracking
 *
 * Fullstack, type-safe event tracking: apps define a Zod event catalog tagged with an
 * owner ("client" | "server"), then build trackers from it that only allow firing
 * events owned by that side — enforced at compile time, not by convention.
 *
 * - **Root** (this module): isomorphic catalog types, `Destination`, consent helpers — safe to import from both client and server code.
 * - **`@codefast/tracking/client`**: `createClientTracker` — batching, offline queue, retry.
 * - **`@codefast/tracking/server`**: `createServerTracker`, region detection for consent.
 * - **`@codefast/tracking/destinations`**: `createHttpDestination` and the `Destination` building block.
 */
export * from "#/core";
