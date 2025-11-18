import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import type { ReactNode } from 'react'
import { DefaultCatchBoundary } from '@/components/default-catch-boundary.tsx'
import { NotFound } from '@/components/not-found'
import { routeTree } from '@/routeTree.gen'
import {
  Provider as TanstackQueryProvider,
  getContext,
} from '@/integrations/tanstack-query/root-provider'

export const getRouter = () => {
  const { queryClient } = getContext()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: (props: { children: ReactNode }) => {
      return (
        <TanstackQueryProvider queryClient={queryClient}>
          {props.children}
        </TanstackQueryProvider>
      )
    },
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}
