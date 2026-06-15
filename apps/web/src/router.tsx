import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { NotFound } from "#/components/shared/not-found";
import { routeTree } from "#/routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultNotFoundComponent: DefaultNotFound,
  });

  return router;
}

function DefaultNotFound() {
  return (
    <NotFound
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      className="pt-24"
    />
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
