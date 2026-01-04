# @codefast/theme

Theme management with React 19 features - optimistic updates, cross-tab sync, and SSR support.

## Features

- 🚀 **React 19 Optimized** - Uses `useOptimistic`, `useSyncExternalStore`, `useEffectEvent`
- 🌗 **System Theme Detection** - Automatically detects and follows OS preference
- 🔄 **Cross-tab Sync** - Theme changes sync across all open tabs
- ⚡ **Optimistic Updates** - Immediate UI feedback during theme changes
- 🎯 **SSR Ready** - FOUC prevention with inline script
- 🔌 **Framework Adapters** - Built-in TanStack Start adapter, extensible for others

## Installation

```bash
pnpm add @codefast/theme
```

## Usage

### TanStack Start

```tsx
// routes/__root.tsx
import { ThemeProvider, ThemeScript, resolveTheme } from '@codefast/theme';
import { getThemeServerFn, setThemeServerFn } from '@codefast/theme/tanstack-start';

export const Route = createRootRoute({
  loader: async () => {
    const theme = await getThemeServerFn();
    return { theme };
  },
  component: RootComponent,
  head: ({ loaderData }) => ({
    scripts: [
      { tag: ThemeScript, props: { theme: loaderData?.theme ?? 'system' } },
    ],
  }),
});

function RootComponent() {
  const { theme } = Route.useLoaderData();

  return (
    <ThemeProvider
      theme={theme}
      persistTheme={(value) => setThemeServerFn({ data: value })}
    >
      <Outlet />
    </ThemeProvider>
  );
}
```

### In Components

```tsx
import { useTheme, themes } from '@codefast/theme';

function ThemeToggle() {
  const { theme, setTheme, isPending } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      disabled={isPending}
    >
      {themes.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}
```

## API

### ThemeProvider

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `Theme` | Initial theme value |
| `persistTheme` | `(value: Theme) => Promise<void>` | Callback to persist theme |
| `disableTransitionOnChange` | `boolean` | Disable CSS transitions during theme change |
| `nonce` | `string` | CSP nonce for inline styles |

### useTheme

Returns `ThemeContextType`:

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `Theme` | Current theme preference |
| `resolvedTheme` | `ResolvedTheme` | Resolved theme ('light' or 'dark') |
| `setTheme` | `(value: Theme) => Promise<void>` | Set theme function |
| `isPending` | `boolean` | Whether theme change is in progress |

## License

MIT
