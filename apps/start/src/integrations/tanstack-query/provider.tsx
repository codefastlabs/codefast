import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';

export function getContext(): { queryClient: QueryClient } {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}

export function Provider({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }): JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
