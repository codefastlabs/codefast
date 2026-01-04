import { QueryClient } from '@tanstack/react-query';

export function getQueryClient(): { queryClient: QueryClient } {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}
