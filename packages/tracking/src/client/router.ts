import type { ClientTracker } from "#/client/create-client-tracker";
import type { EventCatalog } from "#/core/event-catalog";

interface ResolvedNavigation {
  toLocation: {
    href: string;
    pathname: string;
  };
}

/**
 * Structurally matches `Router["subscribe"]` from `@tanstack/router-core` for the
 * `"onResolved"` event — duck-typed so this package doesn't depend on TanStack Router.
 */
export interface RouterLike {
  subscribe: (eventType: "onResolved", fn: (event: ResolvedNavigation) => void) => () => void;
}

/**
 * `onResolved` (not `popstate`) is what fires on SPA navigation in TanStack Router;
 * `popstate` only fires for browser back/forward.
 */
export function attachRouterPageTracking<Catalog extends EventCatalog>(
  tracker: Pick<ClientTracker<Catalog>, "page">,
  router: RouterLike,
): () => void {
  return router.subscribe("onResolved", (event) => {
    tracker.page(event.toLocation.pathname, { href: event.toLocation.href });
  });
}
