import { TanStackDevtools } from '@tanstack/react-devtools';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { createPersistTheme, getThemeServerFn } from '@codefast/theme/adapters/tanstack-start';
import { ThemeProvider, ThemeScript, resolveTheme } from '@codefast/theme';
import type { QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import TanStackFormDevtools from '@/integrations/tanstack-form/devtools';
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools';
import TanStackRouterDevtools from '@/integrations/tanstack-router/devtools';
import appCss from '@/styles/globals.css?url';

interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  loader: async () => {
    const theme = await getThemeServerFn();

    return { theme };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '@codefast/ui — Modern React Component Library' },
      {
        name: 'description',
        content:
          'A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: '@codefast/ui' },
      {
        property: 'og:title',
        content: '@codefast/ui — Modern React Component Library',
      },
      {
        property: 'og:description',
        content:
          'A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: '@codefast/ui — Modern React Component Library',
      },
      {
        name: 'twitter:description',
        content:
          'A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootShellComponent,
});

const persistTheme = createPersistTheme();

function RootShellComponent({ children }: PropsWithChildren) {
  const { theme } = Route.useLoaderData();
  const resolvedTheme = resolveTheme(theme);

  return (
    <html className={resolvedTheme} lang="en" style={{ colorScheme: resolvedTheme }} suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider theme={theme} persistTheme={persistTheme} disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[TanStackRouterDevtools, TanStackQueryDevtools, TanStackFormDevtools]}
        />
        <Scripts />
      </body>
    </html>
  );
}
