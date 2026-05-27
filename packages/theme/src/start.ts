/**
 * TanStack Start integration: HTTP-only color scheme cookie + server functions.
 *
 * Peer: `@tanstack/react-start`. The app keeps full control of `<html>`, `<head>`, and `<body>`.
 * Use {@link getRootColorSchemeServerFn} in the root loader, then wire `@codefast/theme` primitives
 * (`AppearanceProvider`, `AppearanceScript`, `resolveColorScheme`).
 *
 * @example
 * ```tsx
 * // __root.tsx
 * import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
 * import { getRootColorSchemeServerFn, getColorSchemeServerFn, persistColorSchemeCookie } from "@codefast/theme/start";
 * import { AppearanceProvider, AppearanceScript, resolveColorScheme } from "@codefast/theme";
 *
 * export const Route = createRootRouteWithContext<RootRouterContext>()({
 *   loader: async () => getRootColorSchemeServerFn(),
 *   shellComponent: RootShellComponent,
 * });
 *
 * function RootShellComponent({ children }: PropsWithChildren) {
 *   const { colorScheme, ssrColorScheme } = Route.useLoaderData();
 *   const resolvedColorScheme = resolveColorScheme(colorScheme, ssrColorScheme);
 *
 *   return (
 *     <html className={resolvedColorScheme} lang="en" style={{ colorScheme: resolvedColorScheme }} suppressHydrationWarning>
 *       <head>
 *         <HeadContent />
 *         <AppearanceScript colorScheme={colorScheme} />
 *       </head>
 *       <body>
 *         <AppearanceProvider
 *           colorScheme={colorScheme}
 *           ssrColorScheme={ssrColorScheme}
 *           persistColorScheme={persistColorSchemeCookie}
 *           syncColorSchemeFromServer={getColorSchemeServerFn}
 *         >
 *           {children}
 *         </AppearanceProvider>
 *         <Scripts />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

export {
  getRootColorSchemeServerFn,
  getSsrColorSchemeServerFn,
  getColorSchemeServerFn,
  persistColorSchemeCookie,
  setColorSchemeServerFn,
  type RootColorSchemeLoaderData,
} from "#/adapters/tanstack-start/server";
