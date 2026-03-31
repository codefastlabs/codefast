import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { DefaultCatchBoundary } from "#components/default-catch-boundary";
import { NotFound } from "#components/not-found";
import { getQueryClient } from "#integrations/tanstack-query/provider";
import { routeTree } from "#routeTree.gen";

export const getRouter = () => {
  const { queryClient } = getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
