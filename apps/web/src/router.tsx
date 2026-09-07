import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { ensureVisitorConsentResolved } from "#/features/tracking/lib/visitor-consent";
import { routeTree } from "#/routeTree.gen";

export function getRouter() {
  // Router creation runs before hydration on the client — kicking the region resolve here
  // overlaps the server-function round trip with hydration instead of waiting for the
  // first effect, so EU/VN visitors see the consent banner sooner.
  if (typeof window !== "undefined") {
    ensureVisitorConsentResolved();
  }

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
