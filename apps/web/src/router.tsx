import { createRouter as createTanStackRouter } from "@tanstack/react-router";
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
    <main className="container mx-auto flex flex-col items-center px-4 pt-24 pb-32 text-center">
      <h1 className="mb-3 text-3xl font-bold tracking-[-0.035em] text-foreground">
        Page not found
      </h1>
      <p className="max-w-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
    </main>
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
