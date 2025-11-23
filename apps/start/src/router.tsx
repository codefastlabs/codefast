import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import type { ReactNode } from 'react';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary';
import { NotFound } from '@/components/not-found';
import { routeTree } from '@/routeTree.gen';
import { Provider as TanstackQueryProvider, getContext } from '@/integrations/tanstack-query/provider';
import { Provider as ThemeProvider } from '@/integrations/theme/provider';

export const getRouter = () => {
  const { queryClient } = getContext();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: WrapComponent,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

type WrapComponentProps = {
  children: ReactNode;
};

function WrapComponent({ children }: WrapComponentProps) {
  const { queryClient } = getContext();

  return (
    <TanstackQueryProvider queryClient={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </TanstackQueryProvider>
  );
}
