/**
 * TanStack Start adapter for theme persistence via HTTP-only cookies.
 *
 * @example
 * ```tsx
 * // __root.tsx
 * import { getThemeServerFn, setThemeServerFn } from '@codefast/theme/adapters/tanstack-start';
 * import { ThemeProvider, ThemeScript, resolveTheme } from '@codefast/theme';
 *
 * export const Route = createRootRouteWithContext<RootRouterContext>()({
 *   loader: async () => {
 *     const theme = await getThemeServerFn();
 *     return { theme, resolvedTheme: resolveTheme(theme) };
 *   },
 *   shellComponent: RootShellComponent,
 * });
 *
 * function RootShellComponent({ children }: PropsWithChildren) {
 *   const { theme, resolvedTheme } = Route.useLoaderData();
 *
 *   return (
 *     <html className={resolvedTheme} style={{ colorScheme: resolvedTheme }}>
 *       <head>
 *         <ThemeScript theme={theme} />
 *       </head>
 *       <body>
 *         <ThemeProvider
 *           theme={theme}
 *           persistTheme={(value) => setThemeServerFn({ data: value })}
 *         >
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

export { createPersistTheme, getThemeServerFn, setThemeServerFn } from '@/adapters/tanstack-start/server';
