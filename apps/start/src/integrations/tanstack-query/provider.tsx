import { QueryClientProvider as Provider, QueryClient } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';

export function getQueryClient(): { queryClient: QueryClient } {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}

interface ProviderProps {
  children: ReactNode;
  queryClient: QueryClient;
}

export function QueryClientProvider({ children, queryClient }: ProviderProps): JSX.Element {
  return <Provider client={queryClient}>{children}</Provider>;
}
