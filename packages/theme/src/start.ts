/**
 * TanStack Start integration: HTTP-only theme cookie + server functions.
 *
 * Peer: `@tanstack/react-start`. The app keeps full control of `<html>`, `<head>`, and `<body>`.
 * Use {@link getRootThemeServerFn} in the root loader, then wire `@codefast/theme` primitives
 * (`ThemeProvider`, `ThemeScript`, `resolveTheme`).
 *
 * @example
 * ```tsx
 * // __root.tsx
 * import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
 * import { getRootThemeServerFn, getThemeServerFn, persistThemeCookie } from "@codefast/theme/start";
 * import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";
 *
 * export const Route = createRootRouteWithContext<RootRouterContext>()({
 *   loader: async () => getRootThemeServerFn(),
 *   shellComponent: RootShellComponent,
 * });
 *
 * function RootShellComponent({ children }: PropsWithChildren) {
 *   const { theme, ssrSystemTheme } = Route.useLoaderData();
 *   const resolvedTheme = resolveTheme(theme, ssrSystemTheme);
 *
 *   return (
 *     <html className={resolvedTheme} lang="en" style={{ colorScheme: resolvedTheme }} suppressHydrationWarning>
 *       <head>
 *         <HeadContent />
 *         <ThemeScript theme={theme} />
 *       </head>
 *       <body>
 *         <ThemeProvider
 *           theme={theme}
 *           ssrSystemTheme={ssrSystemTheme}
 *           persistTheme={persistThemeCookie}
 *           syncThemeFromServer={getThemeServerFn}
 *         >
 *           {children}
 *         </ThemeProvider>
 *         <Scripts />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

export {
  getRootThemeServerFn,
  getSsrSystemThemeServerFn,
  getThemeServerFn,
  persistThemeCookie,
  setThemeServerFn,
  type RootThemeLoaderData,
} from "#adapters/tanstack-start/server";
