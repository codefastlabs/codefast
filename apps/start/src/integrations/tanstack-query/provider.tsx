import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';

export function getContext(): { queryClient: QueryClient } {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}

type ProviderProps = {
  children: ReactNode;
  queryClient: QueryClient;
};

export function Provider({ children, queryClient }: ProviderProps): JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
